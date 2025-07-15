// Firebase Web SDK Client - Direct browser connection
class FirebaseWebClient {
    constructor() {
        this.initialized = false;
        this.db = null;
        this.auth = null;
    }

    async initialize() {
        try {
            console.log("🔄 Initializing Firebase Web SDK...");
            
            // Check if Firebase is loaded
            if (typeof firebase === 'undefined') {
                console.error("❌ Firebase SDK not loaded");
                return false;
            }
            
            // Firebase config - will be injected by template
            // This config should be loaded via server-side template rendering
            const firebaseConfig = window.FIREBASE_CONFIG || {
                apiKey: "FIREBASE_API_KEY_PLACEHOLDER",
                authDomain: "FIREBASE_AUTH_DOMAIN_PLACEHOLDER",
                projectId: "FIREBASE_PROJECT_ID_PLACEHOLDER",
                storageBucket: "FIREBASE_STORAGE_BUCKET_PLACEHOLDER",
                messagingSenderId: "FIREBASE_MESSAGING_SENDER_ID_PLACEHOLDER",
                appId: "FIREBASE_APP_ID_PLACEHOLDER",
                measurementId: "FIREBASE_MEASUREMENT_ID_PLACEHOLDER"
            };

            console.log("🔧 Firebase config loaded:", firebaseConfig.projectId);

            // Initialize Firebase
            if (!firebase.apps.length) {
                console.log("🔥 Initializing Firebase app...");
                firebase.initializeApp(firebaseConfig);
            } else {
                console.log("✅ Firebase app already initialized");
            }

            this.db = firebase.firestore();
            this.auth = firebase.auth();
            this.initialized = true;
            
            console.log("✅ Firebase Web SDK initialized successfully");
            console.log("📊 Firestore instance:", this.db ? "Ready" : "Failed");
            
            return true;
        } catch (error) {
            console.error("❌ Failed to initialize Firebase Web SDK:", error);
            console.error("Error details:", error.message);
            return false;
        }
    }

    async fetchUserDevicesWeb(userId) {
        const result = {
            success: false,
            devices: [],
            logs: [],
            error: null
        };

        try {
            if (!this.initialized) {
                const initSuccess = await this.initialize();
                if (!initSuccess) {
                    result.error = "Failed to initialize Firebase";
                    return result;
                }
            }

            result.logs.push("🔄 Starting Web SDK device fetch...");
            result.logs.push(`👤 User ID: ${userId}`);

            // Query user_devices collection
            const devicesRef = this.db.collection('user_devices');
            result.logs.push("📂 Accessing user_devices collection...");

            // Query for documents where userId matches
            const query = devicesRef.where('userId', '==', userId);
            result.logs.push("🔍 Querying devices for user...");

            // Execute query with timeout
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Query timeout after 15 seconds')), 15000)
            );

            const querySnapshot = await Promise.race([
                query.get(),
                timeoutPromise
            ]);

            result.logs.push(`📊 Query completed, found ${querySnapshot.size} documents`);

            const devices = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                devices.push({
                    id: doc.id,
                    ...data
                });
                result.logs.push(`📱 Device: ${data.deviceId || 'Unknown'} - ${data.deviceInfo?.deviceName || 'No name'}`);
            });

            result.devices = devices;
            result.success = true;
            result.logs.push(`🎉 Successfully fetched ${devices.length} devices`);

        } catch (error) {
            result.error = error.message;
            result.logs.push(`❌ Error: ${error.message}`);
        }

        return result;
    }

    async testConnection() {
        const result = {
            success: false,
            logs: [],
            error: null
        };

        try {
            if (!this.initialized) {
                const initSuccess = await this.initialize();
                if (!initSuccess) {
                    result.error = "Failed to initialize Firebase";
                    return result;
                }
            }

            result.logs.push("🔄 Testing Firebase Web SDK connection...");

            // Try to access the root collections
            const collections = await this.db.collection('user_devices').limit(1).get();
            
            result.logs.push(`✅ Connection successful, collection accessible`);
            result.logs.push(`📊 Sample query returned ${collections.size} documents`);
            
            result.success = true;

        } catch (error) {
            result.error = error.message;
            result.logs.push(`❌ Connection test failed: ${error.message}`);
        }

        return result;
    }
}

// Global instance
window.firebaseWebClient = new FirebaseWebClient();
