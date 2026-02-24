#!/usr/bin/env python3
"""
Board Games App - Setup Verification Script
Checks that all required files and dependencies are in place
"""

import os
import sys
import subprocess
from pathlib import Path

def check_python_version():
    """Check if Python version is 3.9+"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 9):
        print(f"❌ Python 3.9+ required, you have {version.major}.{version.minor}")
        return False
    print(f"✅ Python {version.major}.{version.minor}.{version.micro}")
    return True

def check_node_version():
    """Check if Node.js version is 18+"""
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        version = result.stdout.strip().lstrip('v')
        major = int(version.split('.')[0])
        if major < 18:
            print(f"❌ Node.js 18+ required, you have {version}")
            return False
        print(f"✅ Node.js {version}")
        return True
    except FileNotFoundError:
        print("❌ Node.js not found. Install from https://nodejs.org/")
        return False

def check_dependencies():
    """Check if all required packages are installed"""
    print("\n📦 Checking Python dependencies...")
    required = [
        'fastapi',
        'uvicorn',
        'sqlalchemy',
        'pydantic',
        'python-jose',
        'passlib',
        'bcrypt',
        'email-validator'
    ]
    
    all_found = True
    for package in required:
        try:
            __import__(package.replace('-', '_').replace('[', ''))
            print(f"  ✅ {package}")
        except ImportError:
            print(f"  ❌ {package} - not installed")
            all_found = False
    
    if not all_found:
        print("\n⚠️  Some dependencies missing. Run:")
        print("   cd backend")
        print("   venv\\Scripts\\activate")
        print("   pip install -r requirements.txt")
    
    return all_found

def check_files():
    """Check if all required files exist"""
    print("\n📁 Checking required files...")
    
    files_to_check = [
        ('Backend', [
            'backend/.env',
            'backend/requirements.txt',
            'backend/run.py',
            'backend/init_db.py',
            'backend/app/main.py',
            'backend/app/config.py',
            'backend/app/database.py',
        ]),
        ('Frontend', [
            'web/.env.local',
            'web/package.json',
            'web/tsconfig.json',
            'web/app/page.tsx',
            'web/context/AuthContext.tsx',
            'web/utils/api.ts',
        ])
    ]
    
    backend_ok = True
    frontend_ok = True
    cwd = Path.cwd()
    
    for section, files in files_to_check:
        print(f"\n  {section}:")
        for file_path in files:
            full_path = cwd / file_path
            if full_path.exists():
                print(f"    ✅ {file_path}")
            else:
                print(f"    ❌ {file_path} - NOT FOUND")
                if 'Backend' in section:
                    backend_ok = False
                else:
                    frontend_ok = False
    
    return backend_ok and frontend_ok

def check_database():
    """Check if database can be initialized"""
    print("\n💾 Database files...")
    db_path = Path.cwd() / 'backend' / 'boardgames.db'
    if db_path.exists():
        size_mb = db_path.stat().st_size / (1024 * 1024)
        print(f"  ✅ Database exists ({size_mb:.2f} MB)")
        return True
    else:
        print(f"  ⚠️  Database not found - will be created when you run:")
        print("     python init_db.py")
        return True

def check_ports():
    """Check if required ports are available"""
    print("\n🔌 Checking ports...")
    import socket
    
    ports = {
        8000: "Backend API",
        3000: "Frontend Dev Server"
    }
    
    all_available = True
    for port, name in ports.items():
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(('127.0.0.1', port))
        sock.close()
        
        if result == 0:
            print(f"  ⚠️  Port {port} ({name}) appears to be in use")
            all_available = False
        else:
            print(f"  ✅ Port {port} available ({name})")
    
    return all_available

def main():
    print("=" * 50)
    print("🎮 Board Games App - Setup Verification")
    print("=" * 50)
    
    checks = [
        ("Python Version", check_python_version),
        ("Node.js Version", check_node_version),
        ("Python Dependencies", check_dependencies),
        ("Required Files", check_files),
        ("Database", check_database),
        ("Available Ports", check_ports),
    ]
    
    results = []
    for name, check_func in checks:
        print(f"\n🔍 {name}...")
        try:
            results.append((name, check_func()))
        except Exception as e:
            print(f"  ❌ Error: {e}")
            results.append((name, False))
    
    print("\n" + "=" * 50)
    print("📋 Summary:")
    print("=" * 50)
    
    all_pass = True
    for name, passed in results:
        status = "✅ PASS" if passed else "⚠️  WARNING"
        print(f"{status}: {name}")
        if not passed and "Python Version" in name or "Node.js Version" in name or "Required Files" in name:
            all_pass = False
    
    print("\n" + "=" * 50)
    if all_pass:
        print("✅ You're ready to start!")
        print("\nNext steps:")
        print("1. Open Terminal 1: cd backend && venv\\Scripts\\activate && python run.py")
        print("2. Open Terminal 2: cd web && npm run dev")
        print("3. Open browser: http://localhost:3000")
        print("4. Login with: john@example.com / password123")
    else:
        print("⚠️  Some issues need to be resolved before starting")
        print("\nCheck the warnings above and run:")
        print("  cd backend")
        print("  pip install -r requirements.txt")
        print("  python init_db.py")
    print("=" * 50)
    
    return 0 if all_pass else 1

if __name__ == "__main__":
    sys.exit(main())
