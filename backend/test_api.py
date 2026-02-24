"""Quick test script to verify API endpoints."""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_api():
    """Test basic API endpoints."""
    
    print("Testing Board Games API\n")
    print("=" * 50)
    
    # Test root endpoint
    print("\n1. Testing root endpoint...")
    response = requests.get(f"{BASE_URL}/")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {json.dumps(response.json(), indent=2)}")
    
    # Test health check
    print("\n2. Testing health check...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {json.dumps(response.json(), indent=2)}")
    
    # Test register
    print("\n3. Testing user registration...")
    user_data = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "testpass123",
        "phone": "555-1234",
        "bio": "Test user",
        "home_address": "123 Test St"
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        token = data.get("access_token")
        print(f"   Token: {token[:20]}...")
        print(f"   User: {data.get('user', {}).get('name')}")
        
        # Test getting current user info
        print("\n4. Testing get current user...")
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/users/me", headers=headers)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {json.dumps(response.json(), indent=2)}")
    else:
        print(f"   Error: {response.text}")
    
    # Test list board games
    print("\n5. Testing list board games...")
    response = requests.get(f"{BASE_URL}/games/board-games")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        games = response.json()
        print(f"   Found {len(games)} board games")
        if games:
            print(f"   First game: {games[0].get('name')}")
    
    # Test list events
    print("\n6. Testing list events...")
    response = requests.get(f"{BASE_URL}/events")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        events = response.json()
        print(f"   Found {len(events)} events")
    
    # Test list game queue
    print("\n7. Testing list game queue...")
    response = requests.get(f"{BASE_URL}/game-queue")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        items = response.json()
        print(f"   Found {len(items)} queue items")
    
    print("\n" + "=" * 50)
    print("✅ Basic tests completed!")


if __name__ == "__main__":
    try:
        test_api()
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to API.")
        print("   Make sure the server is running: python run.py")
    except Exception as e:
        print(f"❌ Error: {e}")
