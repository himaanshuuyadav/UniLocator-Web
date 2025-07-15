"""
Simple Firebase Test - Direct approach without complex authentication
"""
import requests
import json
import logging
from typing import Dict

logger = logging.getLogger(__name__)

def simple_firebase_test(project_id: str = "unilocator-368db") -> Dict:
    """
    Simple test using Firebase REST API without authentication
    This tests basic connectivity and collection structure
    """
    result = {
        'success': False,
        'logs': [],
        'error': None,
        'data': None
    }
    
    try:
        result['logs'].append("🔄 Starting simple Firebase connectivity test...")
        
        # Use the public REST API endpoint (no auth required for basic info)
        base_url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)"
        
        result['logs'].append(f"🌐 Testing connection to: {base_url}")
        
        # Test basic connectivity with a simple request
        response = requests.get(f"{base_url}", timeout=10)
        
        result['logs'].append(f"📡 Response status: {response.status_code}")
        
        if response.status_code == 200:
            result['logs'].append("✅ Firebase server is reachable")
            result['success'] = True
            result['data'] = {
                'status': 'reachable',
                'project_id': project_id
            }
        elif response.status_code == 401:
            result['logs'].append("🔒 Firebase server reachable but authentication required (expected)")
            result['success'] = True  # This is actually expected
            result['data'] = {
                'status': 'auth_required',
                'project_id': project_id
            }
        else:
            result['error'] = f"Unexpected status code: {response.status_code}"
            result['logs'].append(f"❌ {result['error']}")
            
    except requests.exceptions.Timeout:
        result['error'] = "Connection timeout after 10 seconds"
        result['logs'].append("⏰ Connection timeout")
    except requests.exceptions.ConnectionError:
        result['error'] = "Cannot connect to Firebase servers"
        result['logs'].append("🚫 Connection failed")
    except Exception as e:
        result['error'] = str(e)
        result['logs'].append(f"❌ Exception: {e}")
    
    return result

def test_with_api_key(api_key: str = "AIzaSyDJKLcI6OdqXmgkzn1bhpgMOhkUzIu5VnU") -> Dict:
    """
    Test Firebase REST API with API key
    """
    result = {
        'success': False,
        'logs': [],
        'error': None,
        'data': None
    }
    
    try:
        result['logs'].append("🔄 Testing Firebase with API key...")
        
        # Try to access documents with API key
        project_id = "unilocator-368db"
        url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/user_devices"
        
        params = {
            'key': api_key
        }
        
        result['logs'].append(f"🔑 Using API key: {api_key[:20]}...")
        result['logs'].append(f"🌐 Requesting: {url}")
        
        response = requests.get(url, params=params, timeout=15)
        
        result['logs'].append(f"📡 Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            result['logs'].append("✅ API key authentication successful")
            
            if 'documents' in data:
                documents = data['documents']
                result['logs'].append(f"📋 Found {len(documents)} documents in user_devices collection")
                result['success'] = True
                result['data'] = {
                    'total_documents': len(documents),
                    'collection': 'user_devices'
                }
            else:
                result['logs'].append("📋 Collection exists but no documents found")
                result['success'] = True
                result['data'] = {
                    'total_documents': 0,
                    'collection': 'user_devices'
                }
        else:
            result['error'] = f"API key test failed: {response.status_code} - {response.text[:200]}"
            result['logs'].append(f"❌ {result['error']}")
            
    except Exception as e:
        result['error'] = str(e)
        result['logs'].append(f"❌ Exception: {e}")
    
    return result
