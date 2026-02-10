const { MongoClient } = require('mongodb');

// Test MongoDB connection
async function testConnection() {
    try {
        // Using the connection string from .env
        const uri = 'mongodb+srv://aadarshgolucky:A%40Wrpcp3.%40737xx@cluster0.oss7hwd.mongodb.net/blog?retryWrites=true&w=majority&appName=Cluster0';
        console.log('Testing connection to:', uri.replace(/:A%40.*@/, ':***@'));
        
        const client = new MongoClient(uri);
        await client.connect();
        
        // Test database operations
        const db = client.db('blog');
        const collection = db.collection('posts');
        
        // Count documents
        const count = await collection.countDocuments();
        console.log(`✅ Connected! Found ${count} documents`);
        
        // Test insert
        const testDoc = {
            title: 'Test Post',
            content: 'Testing MongoDB connection',
            createdAt: new Date()
        };
        
        const result = await collection.insertOne(testDoc);
        console.log(`✅ Inserted test document with ID: ${result.insertedId}`);
        
        // Clean up test document
        await collection.deleteOne({ _id: result.insertedId });
        console.log('✅ Cleaned up test document');
        
        await client.close();
        console.log('✅ Connection test successful!');
        
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        console.error('Full error:', error);
    }
}

testConnection();
