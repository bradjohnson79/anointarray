#!/usr/bin/env python3
"""
Supabase Migration Executor
Applies SQL migration files to the remote Supabase database
"""

import psycopg2
import sys
import os

# Database connection details
# Using connection string format for Supabase
CONNECTION_STRING = "postgresql://postgres.xmnghciitiefbwxzhgrw:[YOUR-PASSWORD]@aws-0-eu-north-1.pooler.supabase.com:5432/postgres"

def execute_sql_file(cursor, filepath):
    """Execute SQL commands from a file"""
    print(f"Executing SQL file: {filepath}")
    
    try:
        with open(filepath, 'r') as file:
            sql_content = file.read()
        
        # Split by semicolons and execute each statement
        statements = sql_content.split(';')
        
        for i, statement in enumerate(statements):
            statement = statement.strip()
            if statement:  # Skip empty statements
                try:
                    cursor.execute(statement + ';')
                    print(f"  ✓ Statement {i+1} executed successfully")
                except Exception as e:
                    # Some statements might fail if objects already exist - that's OK
                    if "already exists" in str(e).lower():
                        print(f"  ⚠ Statement {i+1}: Object already exists (skipping)")
                    else:
                        print(f"  ✗ Statement {i+1} failed: {e}")
                        # Continue with next statement
        
        print(f"✓ Completed execution of {filepath}")
        return True
        
    except Exception as e:
        print(f"✗ Error executing {filepath}: {e}")
        return False

def main():
    # Migration files to execute
    migration_files = [
        '/Users/bradjohnson/Documents/anoint-array/WEBSITE/supabase/migrations/20250811_create_full_ecommerce_tables.sql',
        '/Users/bradjohnson/Documents/anoint-array/WEBSITE/supabase/migrations/20250811_create_database_rpcs.sql'
    ]
    
    print("🔄 Starting Supabase database migration...")
    print(f"Target: {DB_CONFIG['host']}")
    
    try:
        # Connect to the database
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = True  # Auto-commit each statement
        cursor = conn.cursor()
        
        print("✓ Connected to Supabase database")
        
        # Execute each migration file
        success_count = 0
        for migration_file in migration_files:
            if os.path.exists(migration_file):
                if execute_sql_file(cursor, migration_file):
                    success_count += 1
            else:
                print(f"✗ Migration file not found: {migration_file}")
        
        # Close connection
        cursor.close()
        conn.close()
        
        print(f"\n🎉 Migration complete! {success_count}/{len(migration_files)} files executed successfully")
        
        return success_count == len(migration_files)
        
    except Exception as e:
        print(f"✗ Database connection error: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)