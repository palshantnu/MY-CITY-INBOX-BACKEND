const StateCity = require('../models/StateCity');

// Get all states (unique list)
exports.getStates = async (req, res) => {
  try {
    const states = await StateCity.findAll({
      attributes: ['state'],
      group: ['state'],
      order: [['state', 'ASC']]
    });
    res.json(states.map(s => s.state));
  } catch (error) {
    console.error('Error fetching states:', error);
    res.status(500).json({ error: 'Failed to fetch states' });
  }
};

// Get cities by state
exports.getCitiesByState = async (req, res) => {
  try {
    const state = req.params.state;
    const cities = await StateCity.findAll({
      where: { state },
      attributes: ['city'],
      order: [['city', 'ASC']]
    });
    res.json(cities.map(c => c.city));
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
};
