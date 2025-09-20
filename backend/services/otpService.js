const redis = require('redis');
let client;

// Initialize Redis client
if (process.env.REDIS_URL) {
    client = redis.createClient({
        url: process.env.REDIS_URL
    });
    client.connect().catch(console.error);
} else {
    // Fallback to in-memory storage for development
    const otpStore = new Map();
    client = {
        setEx: (key, ttl, value) => {
            otpStore.set(key, value);
            setTimeout(() => otpStore.delete(key), ttl * 1000);
            return Promise.resolve();
        },
        get: (key) => Promise.resolve(otpStore.get(key)),
        del: (key) => {
            otpStore.delete(key);
            return Promise.resolve();
        }
    };
}

const OTP_EXPIRY = 300; // 5 minutes

const generateOTP = (mobile) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const key = `otp:${mobile}`;

    client.setEx(key, OTP_EXPIRY, otp);

    return otp;
};

const verifyOTP = async (mobile, otp) => {
    const key = `otp:${mobile}`;
    const storedOTP = await client.get(key);

    return storedOTP && storedOTP === otp;
};

const deleteOTP = (mobile) => {
    const key = `otp:${mobile}`;
    return client.del(key);
};

module.exports = {
    generateOTP,
    verifyOTP,
    deleteOTP
};

