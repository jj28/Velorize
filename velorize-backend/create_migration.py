#!/usr/bin/env python3
"""
Script to create the initial database migration for Velorize.
Run this script to generate the first Alembic migration with all models.
"""

import os
import sys
import subprocess
from pathlib import Path

def run_command(command, cwd=None):
    """Run a shell command and return the result."""
    print(f"Running: {' '.join(command)}")
    try:
        result = subprocess.run(
            command, 
            cwd=cwd, 
            capture_output=True, 
            text=True, 
            check=True
        )
        print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error: {e}")
        print(f"stdout: {e.stdout}")
        print(f"stderr: {e.stderr}")
        return False

def main():
    """Create initial database migration."""
    
    # Get the backend directory
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    print("Creating initial database migration for Velorize...")
    print(f"Working directory: {os.getcwd()}")
    
    # Check if alembic is available
    if not run_command([sys.executable, "-c", "import alembic; print('Alembic available')"]):
        print("Alembic is not installed. Please install it first:")
        print("pip install alembic")
        return False
    
    # Create the initial migration
    print("\n1. Creating initial migration...")
    success = run_command([
        sys.executable, "-m", "alembic", "revision", 
        "--autogenerate", 
        "-m", "Initial migration with all models"
    ])
    
    if success:
        print("\n✅ Initial migration created successfully!")
        print("\nTo apply the migration to your database, run:")
        print("  python -m alembic upgrade head")
        print("\nOr use Docker Compose:")
        print("  docker-compose up -d db")
        print("  docker-compose exec backend python -m alembic upgrade head")
    else:
        print("\n❌ Failed to create migration")
        return False
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)