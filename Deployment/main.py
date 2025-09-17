#!/usr/bin/env python3
"""
ProSmart AQI - Simple Scheduler
Runs continuously and executes pycarot.py every 30 minutes
No web server - just pure scheduling
"""

import os
import sys
import time
import subprocess
from datetime import datetime
import schedule

# Global variables to track execution status
execution_count = 0

def run_pycarot():
    """Execute pycarot.py and handle errors"""
    global execution_count
    
    try:
        print(f"\n{'='*60}")
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Starting pycarot.py execution...")
        print(f"{'='*60}")
        
        # Execute pycarot.py
        result = subprocess.run(
            [sys.executable, "pycarot.py"],
            cwd=os.path.dirname(os.path.abspath(__file__)),
            text=True,
            timeout=3600  # 1 hour timeout
        )
        
        if result.returncode == 0:
            execution_count += 1
            print(f"\n[SUCCESS] pycarot.py executed successfully! (Execution #{execution_count})")
        else:
            print(f"\n[ERROR] pycarot.py failed with return code: {result.returncode}")
            
    except subprocess.TimeoutExpired:
        print(f"\n[ERROR] pycarot.py execution timed out after 1 hour")
        
    except Exception as e:
        print(f"\n[ERROR] Error executing pycarot.py: {str(e)}")
    
    finally:
        next_run = schedule.next_run()
        print(f"\n[INFO] Next execution scheduled at: {next_run}")
        print(f"{'='*60}\n")

def main():
    """Main function to start the scheduler"""
    print("="*60)
    print("STARTING PROSMART AQI SCHEDULER")
    print("="*60)
    print("pycarot.py will execute every 30 minutes")
    print("Press Ctrl+C to stop")
    print("="*60)
    
    # Schedule to run every 30 minutes
    schedule.every(30).minutes.do(run_pycarot)
    
    # Run immediately on startup
    print("\nRunning pycarot.py immediately on startup...")
    run_pycarot()
    
    # Keep the scheduler running
    print("Scheduler started. pycarot.py will run every 30 minutes.")
    print("Waiting for next execution...\n")
    
    try:
        while True:
            schedule.run_pending()
            time.sleep(60)  # Check every minute
    except KeyboardInterrupt:
        print("\n\n[INFO] Scheduler stopped by user")
        print("Goodbye!")
    except Exception as e:
        print(f"\n[ERROR] Scheduler error: {str(e)}")
        print("Restarting in 60 seconds...")
        time.sleep(60)
        main()  # Restart

if __name__ == "__main__":
    main()