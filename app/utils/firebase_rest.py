"""
Firebase REST API Client - Alternative to Admin SDK
This bypasses the Admin SDK completely and uses direct HTTP requests
"""
import requests
import json
import logging
from typing import Dict, List, Optional
from google.oauth2 import service_account
from google.auth.transport.requests import Request

logger = logging.getLogger(__name__)

class FirebaseRestClient:
    def __init__(self, project_id: str, service_account_path: str):
        self.project_id = project_id
        self.base_url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents"
        
        # Initialize credentials
        try:
            self.credentials = service_account.Credentials.from_service_account_file(
                service_account_path,
                scopes=['https://www.googleapis.com/auth/datastore']
            )
            self.credentials.refresh(Request())
            logger.info("Firebase REST client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Firebase REST client: {e}")
            self.credentials = None
    
    def get_access_token(self) -> Optional[str]:
        """Get a fresh access token"""
        try:
            if self.credentials:
                self.credentials.refresh(Request())
                return self.credentials.token
        except Exception as e:
            logger.error(f"Failed to get access token: {e}")
        return None
    
    def fetch_user_devices(self, user_id: str) -> Dict:
        """Fetch devices for a specific user using REST API"""
        result = {
            'success': False,
            'devices': [],
            'logs': [],
            'error': None
        }
        
        try:
            result['logs'].append("🔄 Starting REST API device fetch...")
            
            # Get access token
            token = self.get_access_token()
            if not token:
                result['error'] = "Failed to get access token"
                return result
            
            result['logs'].append("✅ Got access token")
            
            # Construct query URL
            collection_url = f"{self.base_url}/user_devices"
            
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }
            
            result['logs'].append(f"🔄 Querying: {collection_url}")
            
            # Make request with timeout
            response = requests.get(collection_url, headers=headers, timeout=10)
            
            result['logs'].append(f"📡 Response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                result['logs'].append(f"📊 Raw response keys: {list(data.keys())}")
                
                if 'documents' in data:
                    documents = data['documents']
                    result['logs'].append(f"📋 Found {len(documents)} total documents")
                    
                    user_devices = []
                    for doc in documents:
                        try:
                            # Extract document data
                            doc_data = self._parse_document(doc)
                            if doc_data and doc_data.get('userId') == user_id:
                                user_devices.append(doc_data)
                                result['logs'].append(f"✅ Found device: {doc_data.get('deviceId', 'Unknown')}")
                        except Exception as e:
                            result['logs'].append(f"⚠️ Error parsing document: {e}")
                    
                    result['devices'] = user_devices
                    result['success'] = True
                    result['logs'].append(f"🎉 Successfully found {len(user_devices)} devices for user {user_id}")
                else:
                    result['logs'].append("📋 No documents field in response")
                    result['success'] = True  # Empty collection is valid
            else:
                result['error'] = f"HTTP {response.status_code}: {response.text}"
                result['logs'].append(f"❌ Request failed: {result['error']}")
                
        except requests.exceptions.Timeout:
            result['error'] = "Request timeout after 10 seconds"
            result['logs'].append("⏰ Request timed out")
        except Exception as e:
            result['error'] = str(e)
            result['logs'].append(f"❌ Exception: {e}")
        
        return result
    
    def _parse_document(self, doc: Dict) -> Optional[Dict]:
        """Parse Firestore document format to regular dict"""
        try:
            if 'fields' not in doc:
                return None
            
            parsed = {}
            fields = doc['fields']
            
            for key, value in fields.items():
                if 'stringValue' in value:
                    parsed[key] = value['stringValue']
                elif 'integerValue' in value:
                    parsed[key] = int(value['integerValue'])
                elif 'doubleValue' in value:
                    parsed[key] = float(value['doubleValue'])
                elif 'booleanValue' in value:
                    parsed[key] = value['booleanValue']
                elif 'timestampValue' in value:
                    parsed[key] = value['timestampValue']
                elif 'mapValue' in value and 'fields' in value['mapValue']:
                    # Handle nested objects (like deviceInfo)
                    parsed[key] = self._parse_document({'fields': value['mapValue']['fields']})
                elif 'arrayValue' in value:
                    # Handle arrays
                    parsed[key] = [self._parse_value(item) for item in value['arrayValue'].get('values', [])]
            
            return parsed
        except Exception as e:
            logger.error(f"Error parsing document: {e}")
            return None
    
    def _parse_value(self, value: Dict):
        """Parse individual Firestore value"""
        if 'stringValue' in value:
            return value['stringValue']
        elif 'integerValue' in value:
            return int(value['integerValue'])
        elif 'doubleValue' in value:
            return float(value['doubleValue'])
        elif 'booleanValue' in value:
            return value['booleanValue']
        elif 'timestampValue' in value:
            return value['timestampValue']
        elif 'mapValue' in value:
            return self._parse_document({'fields': value['mapValue']['fields']})
        return value

# Global instance
rest_client = None

def get_rest_client():
    """Get the global REST client instance"""
    global rest_client
    if rest_client is None:
        # Initialize with your project details - using the correct project ID from service account
        rest_client = FirebaseRestClient(
            project_id="unilocator-368db",  # Fixed: matches service account file
            service_account_path="service-account-key.json"
        )
    return rest_client
