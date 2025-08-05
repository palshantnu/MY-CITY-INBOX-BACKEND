const User = require("../models/User");
const VendorRating = require("../models/VendorRating");

exports.submitRating = async (req, res) => {
    let { user_id, vendor_id, rating, review } = req.body;

    if (!user_id || !vendor_id || rating === undefined) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    try {
        rating = parseFloat(rating); // ✅ Ensure numeric

        const existing = await VendorRating.findOne({ where: { user_id, vendor_id } });

        if (existing) {
            await VendorRating.update(
                { rating, review, updated_at: new Date() },
                { where: { user_id, vendor_id } }
            );
            return res.json({ success: true, message: 'Rating updated' });
        } else {
            await VendorRating.create({ user_id, vendor_id, rating, review });
            return res.json({ success: true, message: 'Rating submitted' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getVendorReviews = async (req, res) => {
    const vendorId = req.params.id;  // or req.params.vendor_id depending on your route
  
    if (!vendorId) {
      return res.status(400).json({ success: false, message: 'vendor_id parameter is required' });
    }
  
    try {
      const reviews = await VendorRating.findAll({
        where: { vendor_id: vendorId },
        include: [{ model: User, attributes: ['name'] }]
      });
  
      return res.json({ success: true, reviews });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  };
  