"""Admin CLI tool for API key and user management."""

import sys

import typer
from rich.console import Console
from rich.table import Table

from api.auth import create_api_key, hash_password
from api.database import APIKey, SessionLocal, User, init_db

app = typer.Typer(
    name="api-admin",
    help="Trading Agents API Administration Tool",
)
console = Console()


@app.command()
def create_key(name: str = typer.Argument(..., help="Name/description for the API key")):
    """Create a new API key."""
    # Initialize database
    init_db()

    db = SessionLocal()
    try:
        plain_key, db_key = create_api_key(db, name)

        console.print("\n[green]✓ API Key created successfully![/green]\n")
        console.print(f"[bold]Name:[/bold] {db_key.name}")
        console.print(f"[bold]Created:[/bold] {db_key.created_at}")
        console.print("\n[bold yellow]API Key (save this, it won't be shown again):[/bold yellow]")
        console.print(f"[cyan]{plain_key}[/cyan]\n")
        console.print("[dim]Use this key in the X-API-Key header for all API requests.[/dim]\n")
    except Exception as e:
        console.print(f"[red]Error creating API key: {e}[/red]")
        sys.exit(1)
    finally:
        db.close()


@app.command()
def list_keys():
    """List all API keys."""
    init_db()

    db = SessionLocal()
    try:
        keys = db.query(APIKey).order_by(APIKey.created_at.desc()).all()

        if not keys:
            console.print("[yellow]No API keys found.[/yellow]")
            return

        table = Table(title="API Keys")
        table.add_column("ID", style="cyan")
        table.add_column("Name", style="green")
        table.add_column("Created", style="blue")
        table.add_column("Status", style="magenta")

        for key in keys:
            status = "Active" if key.is_active else "Revoked"
            status_color = "green" if key.is_active else "red"
            table.add_row(
                str(key.id),
                key.name,
                key.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                f"[{status_color}]{status}[/{status_color}]",
            )

        console.print(table)
    finally:
        db.close()


@app.command()
def revoke_key(key_id: int = typer.Argument(..., help="API key ID to revoke")):
    """Revoke an API key."""
    init_db()

    db = SessionLocal()
    try:
        key = db.query(APIKey).filter(APIKey.id == key_id).first()

        if not key:
            console.print(f"[red]API key with ID {key_id} not found.[/red]")
            sys.exit(1)

        if not key.is_active:
            console.print(f"[yellow]API key '{key.name}' is already revoked.[/yellow]")
            return

        key.is_active = False
        db.commit()

        console.print(f"[green]✓ API key '{key.name}' has been revoked.[/green]")
    except Exception as e:
        console.print(f"[red]Error revoking API key: {e}[/red]")
        sys.exit(1)
    finally:
        db.close()


@app.command()
def activate_key(key_id: int = typer.Argument(..., help="API key ID to activate")):
    """Activate a revoked API key."""
    init_db()

    db = SessionLocal()
    try:
        key = db.query(APIKey).filter(APIKey.id == key_id).first()

        if not key:
            console.print(f"[red]API key with ID {key_id} not found.[/red]")
            sys.exit(1)

        if key.is_active:
            console.print(f"[yellow]API key '{key.name}' is already active.[/yellow]")
            return

        key.is_active = True
        db.commit()

        console.print(f"[green]✓ API key '{key.name}' has been activated.[/green]")
    except Exception as e:
        console.print(f"[red]Error activating API key: {e}[/red]")
        sys.exit(1)
    finally:
        db.close()


@app.command()
def init_database():
    """Initialize the database (create tables)."""
    try:
        init_db()
        console.print("[green]✓ Database initialized successfully![/green]")
    except Exception as e:
        console.print(f"[red]Error initializing database: {e}[/red]")
        sys.exit(1)


# User Management Commands


@app.command()
def create_user(
    username: str = typer.Argument(..., help="Username for the new user"),
    password: str = typer.Option(..., prompt=True, hide_input=True, help="Password"),
):
    """Create a new user account."""
    init_db()

    db = SessionLocal()
    try:
        # Check if username already exists
        existing_user = db.query(User).filter(User.username == username).first()
        if existing_user:
            console.print(f"[red]Error: User '{username}' already exists.[/red]")
            sys.exit(1)

        # Create new user
        password_hash = hash_password(password)
        user = User(username=username, password_hash=password_hash, is_active=True)
        db.add(user)
        db.commit()
        db.refresh(user)

        console.print("\n[green]✓ User created successfully![/green]\n")
        console.print(f"[bold]Username:[/bold] {user.username}")
        console.print(f"[bold]Created:[/bold] {user.created_at}")
        console.print("[bold]Status:[/bold] Active\n")
    except Exception as e:
        console.print(f"[red]Error creating user: {e}[/red]")
        sys.exit(1)
    finally:
        db.close()


@app.command()
def list_users():
    """List all user accounts."""
    init_db()

    db = SessionLocal()
    try:
        users = db.query(User).order_by(User.created_at.desc()).all()

        if not users:
            console.print("[yellow]No users found.[/yellow]")
            return

        table = Table(title="Users")
        table.add_column("ID", style="cyan")
        table.add_column("Username", style="green")
        table.add_column("Created", style="blue")
        table.add_column("Status", style="magenta")

        for user in users:
            status = "Active" if user.is_active else "Inactive"
            status_color = "green" if user.is_active else "red"
            table.add_row(
                str(user.id),
                user.username,
                user.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                f"[{status_color}]{status}[/{status_color}]",
            )

        console.print(table)
    finally:
        db.close()


@app.command()
def deactivate_user(user_id: int = typer.Argument(..., help="User ID to deactivate")):
    """Deactivate a user account."""
    init_db()

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()

        if not user:
            console.print(f"[red]User with ID {user_id} not found.[/red]")
            sys.exit(1)

        if not user.is_active:
            console.print(f"[yellow]User '{user.username}' is already inactive.[/yellow]")
            return

        user.is_active = False
        db.commit()

        console.print(f"[green]✓ User '{user.username}' has been deactivated.[/green]")
    except Exception as e:
        console.print(f"[red]Error deactivating user: {e}[/red]")
        sys.exit(1)
    finally:
        db.close()


@app.command()
def activate_user(user_id: int = typer.Argument(..., help="User ID to activate")):
    """Activate a user account."""
    init_db()

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()

        if not user:
            console.print(f"[red]User with ID {user_id} not found.[/red]")
            sys.exit(1)

        if user.is_active:
            console.print(f"[yellow]User '{user.username}' is already active.[/yellow]")
            return

        user.is_active = True
        db.commit()

        console.print(f"[green]✓ User '{user.username}' has been activated.[/green]")
    except Exception as e:
        console.print(f"[red]Error activating user: {e}[/red]")
        sys.exit(1)
    finally:
        db.close()


@app.command()
def change_password(
    username: str = typer.Argument(..., help="Username"),
    password: str = typer.Option(..., prompt=True, hide_input=True, help="New password"),
):
    """Change a user's password."""
    init_db()

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()

        if not user:
            console.print(f"[red]User '{username}' not found.[/red]")
            sys.exit(1)

        user.password_hash = hash_password(password)
        db.commit()

        console.print(f"[green]✓ Password changed successfully for user '{username}'.[/green]")
    except Exception as e:
        console.print(f"[red]Error changing password: {e}[/red]")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    app()
