"""Admin CLI tool for API key management."""

import sys

import typer
from rich.console import Console
from rich.table import Table

from api.auth import create_api_key
from api.database import APIKey, SessionLocal, init_db

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


if __name__ == "__main__":
    app()
