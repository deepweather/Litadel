"""File handling and logging decorators for the Litadel CLI."""

from functools import wraps
from pathlib import Path


def save_message_decorator(message_buffer, log_file):
    """Decorator to save messages to log file after they're added to buffer."""
    original_add_message = message_buffer.add_message
    
    @wraps(original_add_message)
    def wrapper(*args, **kwargs):
        original_add_message(*args, **kwargs)
        timestamp, message_type, content = message_buffer.messages[-1]
        content = content.replace("\n", " ")  # Replace newlines with spaces
        with open(log_file, "a") as f:
            f.write(f"{timestamp} [{message_type}] {content}\n")
    
    return wrapper


def save_tool_call_decorator(message_buffer, log_file):
    """Decorator to save tool calls to log file after they're added to buffer."""
    original_add_tool_call = message_buffer.add_tool_call
    
    @wraps(original_add_tool_call)
    def wrapper(*args, **kwargs):
        original_add_tool_call(*args, **kwargs)
        timestamp, tool_name, args = message_buffer.tool_calls[-1]
        args_str = ", ".join(f"{k}={v}" for k, v in args.items())
        with open(log_file, "a") as f:
            f.write(f"{timestamp} [Tool Call] {tool_name}({args_str})\n")
    
    return wrapper


def save_report_section_decorator(message_buffer, report_dir):
    """Decorator to save report sections to markdown files after they're updated."""
    original_update_report_section = message_buffer.update_report_section
    
    @wraps(original_update_report_section)
    def wrapper(section_name, content):
        original_update_report_section(section_name, content)
        if section_name in message_buffer.report_sections and message_buffer.report_sections[section_name] is not None:
            content = message_buffer.report_sections[section_name]
            if content:
                file_name = f"{section_name}.md"
                with open(report_dir / file_name, "w") as f:
                    f.write(content)
    
    return wrapper


def setup_file_handlers(message_buffer, results_dir: Path):
    """
    Setup file handlers for logging messages, tool calls, and reports.
    
    Args:
        message_buffer: The MessageBuffer instance to decorate
        results_dir: Directory where results should be saved
        
    Returns:
        tuple: (log_file, report_dir) paths for reference
    """
    # Create directories
    results_dir.mkdir(parents=True, exist_ok=True)
    report_dir = results_dir / "reports"
    report_dir.mkdir(parents=True, exist_ok=True)
    log_file = results_dir / "message_tool.log"
    log_file.touch(exist_ok=True)
    
    # Apply decorators
    message_buffer.add_message = save_message_decorator(message_buffer, log_file)
    message_buffer.add_tool_call = save_tool_call_decorator(message_buffer, log_file)
    message_buffer.update_report_section = save_report_section_decorator(message_buffer, report_dir)
    
    return log_file, report_dir

