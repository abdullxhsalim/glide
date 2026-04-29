const Groq = require('groq-sdk');
const User = require('../models/User');
const Ride = require('../models/Ride');
const PartnerRequest = require('../models/PartnerRequest');
const Booking = require('../models/Booking');

let groqClient = null;

const getGroqClient = () => {
  const apiKey = (process.env.GROQ_API_KEY || '').trim();
  if (!apiKey) {
    return null;
  }

  if (!groqClient) {
    groqClient = new Groq({ apiKey });
  }

  return groqClient;
};

const generateCompletion = async (systemPrompt, userPrompt) => {
  const client = getGroqClient();
  if (!client) {
    const error = new Error('Missing GROQ_API_KEY');
    error.statusCode = 503;
    throw error;
  }

  const chatCompletion = await client.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    model: 'llama-3.1-8b-instant',
    temperature: 0.7,
    max_tokens: 1024,
  });
  return chatCompletion.choices[0]?.message?.content || "No response generated.";
};

const adminChat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    // Gather global stats for the admin
    const totalUsers = await User.countDocuments();
    const totalRides = await Ride.countDocuments();
    const activeRides = await Ride.countDocuments({ status: { $in: ['scheduled', 'in-progress'] } });
    const matchRequests = await PartnerRequest.countDocuments();
    
    // Group counts by role
    const sharers = await User.countDocuments({ role: 'driver' });
    const hoppers = await User.countDocuments({ role: 'rider' });

    const systemPrompt = `You are pouchAI, an expert data analyst and business AI assistant integrated into the Glide admin dashboard. 
Your goal is to help the administrator make informed business decisions using the current platform statistics.
Current Platform Stats:
- Total Users: ${totalUsers} (${sharers} Sharers, ${hoppers} Hoppers)
- Total Ride Posts: ${totalRides} (${activeRides} currently active/scheduled)
- Matchmaking Requests: ${matchRequests}

Always be concise, professional, and actionable. Do not format responses with complex markdown, just simple text and bullet points.`;

    const responseText = await generateCompletion(systemPrompt, message);
    return res.json({ reply: responseText });
  } catch (error) {
    console.error('Error in admin chat:', error);
    const statusCode = error.statusCode || 500;
    const message = error.statusCode === 503
      ? 'AI service is not configured. Missing GROQ_API_KEY.'
      : 'Failed to communicate with pouchAI. Check Groq API Key.';
    return res.status(statusCode).json({ error: message });
  }
};

const userChat = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id; // From auth middleware

    if (!message) return res.status(400).json({ error: 'Message is required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Gather user-specific stats
    const userRidesPosted = await Ride.countDocuments({ driver: userId });
    
    // Booking counts involving the user
    // A user might be part of acceptedHoppers array or have Bookings 
    const userPassengerBookings = await Ride.countDocuments({ acceptedHoppers: userId });
    
    const roleString = user.role === 'driver' ? 'Sharer' : 'Hopper';

    const systemPrompt = `You are pouchAI, an intuitive and friendly AI assistant for the Glide app. 
You are helping a specific user, ${user.name}, who is a ${roleString}.
User's specific stats:
- Rides posted (as Sharer): ${userRidesPosted}
- Rides joined (as Hopper): ${userPassengerBookings}

Your goal is to provide tailored advice to this user to optimize their experience, improve safety, or plan their rides. Keep it conversational and brief. Maintain privacy and do not invent new facts.`;

    const responseText = await generateCompletion(systemPrompt, message);
    return res.json({ reply: responseText });
  } catch (error) {
    console.error('Error in user chat:', error);
    const statusCode = error.statusCode || 500;
    const message = error.statusCode === 503
      ? 'AI service is not configured. Missing GROQ_API_KEY.'
      : 'Failed to communicate with pouchAI. Check Groq API Key.';
    return res.status(statusCode).json({ error: message });
  }
};

module.exports = { adminChat, userChat };
