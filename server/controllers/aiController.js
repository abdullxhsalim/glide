const User = require('../models/User');
const Ride = require('../models/Ride');
const Booking = require('../models/Booking');
const PartnerRequest = require('../models/PartnerRequest');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

const sanitizeMessages = (messages) => {
  if (!Array.isArray(messages)) return [];

  return messages
    .filter((msg) => msg && typeof msg.content === 'string')
    .slice(-8)
    .map((msg) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: String(msg.content).slice(0, 1200)
    }));
};

const callGroq = async ({ systemPrompt, userMessage, history }) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured on server');
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    ...sanitizeMessages(history),
    { role: 'user', content: String(userMessage || '').slice(0, 1600) }
  ];

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages,
      temperature: 0.35,
      max_tokens: 600
    })
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data?.error?.message || 'Groq API request failed';
    throw new Error(message);
  }

  return data?.choices?.[0]?.message?.content || 'I could not generate a response right now.';
};

const chatForUserSide = async (req, res) => {
  try {
    const { message, history = [], mode = 'hopper' } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const userName = req.user?.name || 'User';
    const userRole = req.user?.role || 'rider';

    const modeHint = String(mode || '').toLowerCase() === 'sharer'
      ? 'The user is currently in Sharer mode and may ask about publishing rides, pricing, ride preferences, seats, and managing requests.'
      : 'The user is currently in Hopper mode and may ask about searching rides, booking seats, matching with partners, and trip preparation.';

    const systemPrompt = [
      'You are pouchAI, an AI Assistant for university ride-sharing users.',
      'Be practical, concise, and safety-oriented.',
      'You can guide on ride search, sharing, booking flow, timing, etiquette, and platform features.',
      'Do not invent app actions that do not exist. If uncertain, say so and offer a safe next step.',
      'Do not provide legal, medical, or emergency-response claims. Encourage contacting local emergency services for urgent danger.',
      `Current signed-in user: ${userName} (${userRole}).`,
      modeHint
    ].join(' ');

    const reply = await callGroq({
      systemPrompt,
      userMessage: message,
      history
    });

    return res.status(200).json({
      reply,
      model: DEFAULT_MODEL
    });
  } catch (error) {
    console.error('User AI chat error:', error);
    return res.status(500).json({ message: error.message || 'AI assistant is currently unavailable' });
  }
};

const buildAdminContext = async () => {
  const [
    totalUsers,
    totalSharers,
    totalHoppers,
    pendingVerifications,
    totalRides,
    totalBookings,
    pendingBookings,
    acceptedBookings,
    completedBookings,
    cancelledBookings,
    totalPartnerRequests,
    estimatedRevenueRows
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: 'driver' }),
    User.countDocuments({ role: { $in: ['rider', 'hopper'] } }),
    User.countDocuments({ vehicleVerificationStatus: 'pending' }),
    Ride.countDocuments({}),
    Booking.countDocuments({}),
    Booking.countDocuments({ status: 'pending' }),
    Booking.countDocuments({ status: 'accepted' }),
    Booking.countDocuments({ status: 'completed' }),
    Booking.countDocuments({ status: 'cancelled' }),
    PartnerRequest.countDocuments({}),
    Booking.aggregate([
      { $match: { status: { $in: ['accepted', 'completed'] } } },
      { $group: { _id: null, revenue: { $sum: '$tripPrice' } } }
    ])
  ]);

  return {
    totalUsers,
    totalSharers,
    totalHoppers,
    pendingVerifications,
    totalRides,
    totalBookings,
    pendingBookings,
    acceptedBookings,
    completedBookings,
    cancelledBookings,
    totalPartnerRequests,
    estimatedRevenue: Number(estimatedRevenueRows?.[0]?.revenue || 0)
  };
};

const chatForAdminSide = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const adminContext = await buildAdminContext();

    const systemPrompt = [
      'You are Glide Admin Intelligence Assistant.',
      'You help admins interpret metrics and suggest practical business/operations actions.',
      'Focus on user growth, ride utilization, conversion bottlenecks, and verification ops.',
      'Ground your response in the supplied context. If data is missing, be explicit.',
      'Keep responses short with action-focused bullet points.',
      `Current operational context: ${JSON.stringify(adminContext)}`
    ].join(' ');

    const reply = await callGroq({
      systemPrompt,
      userMessage: message,
      history
    });

    return res.status(200).json({
      reply,
      model: DEFAULT_MODEL,
      contextSnapshot: adminContext
    });
  } catch (error) {
    console.error('Admin AI chat error:', error);
    return res.status(500).json({ message: error.message || 'AI assistant is currently unavailable' });
  }
};

module.exports = {
  chatForUserSide,
  chatForAdminSide
};
