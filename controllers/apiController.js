const User = require('../models/User');
const bcrypt = require('bcrypt');
const Vendor = require('../models/Vendor');
const StateCity = require('../models/StateCity');
const Subcategory = require('../models/Subcategory');
const Category = require('../models/Category');
const SalesExecutive = require('../models/SalesExecutive');
const Slider = require('../models/Slider');
const PageContent = require('../models/PageContent');
const Feedback = require('../models/Feedback');
const UserNotification = require('../models/UserNotification');
const Notification = require('../models/Notification');
const Bookmark = require('../models/Bookmark');

exports.register = async (req, res) => {
  console.log(req.body);

  try {
    const { name, email, mobile, password, city, state } = req.body;

    // Validate required fields
    if (!name || !email || !mobile || !password) {
      return res.status(400).json({ message: 'Name, Email, Mobile, and Password are required.' });
    }

    // Check for duplicate email
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({ message: 'Email is already registered.' });
    }

    // Check for duplicate mobile
    const existingMobile = await User.findOne({ where: { mobile } });
    if (existingMobile) {
      return res.status(409).json({ message: 'Mobile number is already registered.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with city and state
    const newUser = await User.create({
      name,
      email,
      mobile,
      password: hashedPassword,
      city,
      state,
    });

    return res.status(201).json({
      message: 'User registered successfully',
      user: newUser
    });

  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};



exports.login = async (req, res) => {
  const { mobile, password, device_token } = req.body;

  // Validate input
  if (!mobile || !password) {
    return res.status(400).json({ message: 'Mobile and Password are required.' });
  }

  try {
    // Find user by mobile
    const user = await User.findOne({ where: { mobile } });

    if (!user) {
      return res.status(404).json({ message: 'User not found with this mobile number.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password.' });
    }

    // ✅ Save device_token if provided
    if (device_token) {
      user.device_token = device_token;
      await user.save();
    }

    // Optional: generate token here (e.g., JWT)
    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        city: user.city,
        state: user.state,
        role: 'user',
        device_token: user.device_token
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};



exports.registerVendor = async (req, res) => {
  try {
    const {
      shop_name,
      address,
      city,
      state,
      contact_number,
      facilities,
      category_id,
      subcategory_id,
      created_by = 'self',
      sales_executive_id,
      password
    } = req.body;

    // Validate required fields
    if (!shop_name || !address || !contact_number || !password) {
      return res.status(400).json({ message: 'Required fields missing.' });
    }

    // Check duplicate contact number
    const existingVendor = await Vendor.findOne({ where: { contact_number } });
    if (existingVendor) {
      return res.status(409).json({ message: 'Contact number already registered.' });
    }

    // Process uploaded files (multer middleware will populate req.files)
    const imagePaths = req.files ? req.files.map(file => file.filename) : [];


    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new vendor
    const newVendor = await Vendor.create({
      shop_name,
      address,
      city,
      state,
      contact_number,
      facilities,
      category_id: category_id || null,
      subcategory_id: subcategory_id || null,
      images: imagePaths,
      created_by,
      sales_executive_id: sales_executive_id || null,
      verified: 0,
      password: hashedPassword
    });

    return res.status(201).json({
      message: 'Vendor registered successfully',
      vendor: newVendor
    });

  } catch (error) {
    console.error('Vendor Registration Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.registerSalesExecutive = async (req, res) => {
  try {
    const {
      name,
      contact_number,
      document_title,
      bank_name,
      bank_account_name,
      bank_account_number,
      bank_ifsc,
      password
    } = req.body;

    // Validation
    if (
      !name ||
      !contact_number ||
      !document_title ||
      !bank_name ||
      !bank_account_name ||
      !bank_account_number ||
      !password ||
      !bank_ifsc
    ) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Check duplicate contact number
    const existing = await SalesExecutive.findOne({ where: { contact_number } });
    if (existing) {
      return res.status(409).json({ message: 'Contact number already registered.' });
    }

    // Get uploaded file names
    const documentFile = req.files?.document?.[0]?.filename || null;
    const passbookImage = req.files?.passbook?.[0]?.filename || null;

    if (!documentFile) {
      return res.status(400).json({ message: 'Identification document is required.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    // Insert into DB
    const newSales = await SalesExecutive.create({
      name,
      contact_number,
      password: hashedPassword,
      document_title,
      document_file: documentFile,
      bank_name,
      bank_account_name,
      bank_account_number,
      bank_ifsc,
      bank_passbook_img: passbookImage || null,
      verified: 0
    });

    return res.status(201).json({
      message: 'Sales Executive registered successfully.',
      salesExecutive: newSales
    });

  } catch (err) {
    console.error('Sales Registration Error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({ attributes: ['id', 'name', 'image'] });
    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getSubcategories = async (req, res) => {
  const { category_id } = req.params;

  if (!category_id) {
    return res.status(400).json({
      success: false,
      message: 'category_id is required',
    });
  }

  try {
    const subcategories = await Subcategory.findAll({
      where: { category_id },
      attributes: ['id', 'name', 'image'],
    });

    return res.status(200).json({
      success: true,
      subcategories,
    });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};


exports.getStates = async (req, res) => {
  try {
    const states = await StateCity.findAll({
      attributes: ['state'],
      group: ['state'],
      raw: true
    });
    const stateList = states.map(s => s.state);
    res.json({ states: stateList });
  } catch (error) {
    console.error('Error fetching states:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get cities for a specific state
exports.getCitiesByState = async (req, res) => {
  const state = req.query.state;
  if (!state) {
    return res.status(400).json({ error: 'State parameter is required' });
  }

  try {
    const cities = await StateCity.findAll({
      attributes: ['city'],
      where: { state },
      raw: true
    });
    const cityList = cities.map(c => c.city);
    res.json({ state, cities: cityList });
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getVendorsByCityState = async (req, res) => {
  try {
    const { city, state } = req.body;

    if (!city && !state) {
      return res.status(400).json({ success: false, message: 'Please provide city or state to filter' });
    }

    // Build dynamic where condition based on input
    let whereCondition = {
      verified: 1, // Only verified vendors
    };
    if (city) whereCondition.city = city;
    if (state) whereCondition.state = state;

    const vendors = await Vendor.findAll({
      where: whereCondition,
      attributes: {
        exclude: ['password', 'sales_executive_id']
      },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: Subcategory, as: 'subcategory', attributes: ['id', 'name'] },
        // Optionally include sales executive if needed
        // { model: SalesExecutive, as: 'sales_executive', attributes: ['id', 'name'] }
      ],
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: vendors
    });
  } catch (error) {
    console.error('❌ Error fetching vendors by city/state:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [['id', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
exports.getSlider = async (req, res) => {
  try {
    const app_sliders = await Slider.findAll({
      order: [['id', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: app_sliders
    });
  } catch (error) {
    console.error('❌ Error fetching sliders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.getVendorsFiltered = async (req, res) => {
  try {
    const { city, state, category_id, subcategory_id } = req.body;

    // Build where clause dynamically
    const vendorWhere = {
      verified: 1 // ✅ Only verified vendors
    };

    if (city) vendorWhere.city = city;
    if (state) vendorWhere.state = state;
    if (category_id) vendorWhere.category_id = category_id;
    if (subcategory_id) vendorWhere.subcategory_id = subcategory_id;

    const vendors = await Vendor.findAll({
      where: vendorWhere,
      attributes: [
        'id',
        'shop_name',
        'address',
        'city',
        'state',
        'contact_number',
        'facilities',
        'images',
        'verified',
        'created_at',
      ],
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'image'],
        },
        {
          model: Subcategory,
          as: 'subcategory',
          attributes: ['id', 'name', 'image'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    return res.json({ success: true, data: vendors });
  } catch (error) {
    console.error('Error fetching filtered vendors:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getPageByKey = async (req, res) => {
  const { key } = req.params;

  try {
    const page = await PageContent.findOne({ where: { key } });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found',
      });
    }

    return res.json({
      success: true,
      data: {
        key: page.key,
        title: page.title,
        content: page.content,
      },
    });
  } catch (error) {
    console.error('Error in getPageByKey:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.query.id; // Replace with req.user.id if using auth
    if (!userId) return res.status(400).json({ success: false, message: 'User ID required' });

    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'mobile', 'city', 'state']
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true, user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        city: user.city,
        state: user.state,
        role: 'user',
      }
    });
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/user/update-profile
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.body.id; // Replace with req.user.id if using auth
    const { name, email, mobile, city, state } = req.body;

    if (!userId) return res.status(400).json({ success: false, message: 'User ID required' });

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.mobile = mobile || user.mobile;
    user.city = city || user.city;
    user.state = state || user.state;

    await user.save();

    return res.json({ success: true, message: 'Profile updated successfully', data: user });
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


exports.createFeedback = async (req, res) => {
  try {
    const { user_id, name, email, subject, message } = req.body;

    // Basic validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields (name, email, subject, message) are required.'
      });
    }

    // Create record
    const fb = await Feedback.create({
      user_id: user_id || null,
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim()
    });

    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: { id: fb.id }
    });
  } catch (err) {
    console.error('createFeedback error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.markNotificationsSeen = async (req, res) => {
  try {
    const { userId } = req.body;

    const notifications = await UserNotification.findAll({
      where: { user_id: userId, seen: false },
      limit: 10,
      attributes: ['id']
    });

    if (notifications.length === 0) {
      return res.status(404).json({ success: false, message: 'No unseen notifications found' });
    }

    const ids = notifications.map(n => n.id);

    const [updated] = await UserNotification.update(
      { seen: true, seen_at: new Date() },
      { where: { id: ids } }
    );

    return res.json({ success: true, message: `Marked ${updated} notifications as seen` });
  } catch (error) {
    console.error('Error marking notifications seen:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getNotificationCount = async (req, res) => {
  try {
    const { userId } = req.body;

    const count = await UserNotification.count({
      where: { user_id: userId, seen: false }
    });

    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      order: [['created_at', 'DESC']],
      raw: true
    });

    return res.json({ success: true, data: notifications });
  } catch (err) {
    console.error('getNotifications error:', err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === 'production'
          ? 'Server error'
          : err.message
    });
  }
};

exports.addBookmark = async (req, res) => {
  const { user_id, vendor_id } = req.body;

  if (!user_id || !vendor_id) {
    return res.status(400).json({ success: false, message: 'user_id and vendor_id are required' });
  }

  try {
    // Check if already exists
    const exists = await Bookmark.findOne({ where: { user_id, vendor_id } });
    if (exists) {
      return res.status(200).json({ success: true, message: 'Already bookmarked' });
    }

    const bookmark = await Bookmark.create({ user_id, vendor_id });
    return res.status(201).json({ success: true, message: 'Bookmark added', data: bookmark });

  } catch (error) {
    console.error('addBookmark error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Remove bookmark
exports.removeBookmark = async (req, res) => {
  const { user_id, vendor_id } = req.body;

  if (!user_id || !vendor_id) {
    return res.status(400).json({ success: false, message: 'user_id and vendor_id are required' });
  }

  try {
    const deleted = await Bookmark.destroy({ where: { user_id, vendor_id } });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Bookmark not found' });
    }

    return res.status(200).json({ success: true, message: 'Bookmark removed' });

  } catch (error) {
    console.error('removeBookmark error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// List bookmarks
exports.listBookmarks = async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ success: false, message: 'user_id is required' });
  }

  try {
    const bookmarks = await Bookmark.findAll({
      where: { user_id },
      include: [
        {
          model: Vendor,
          attributes: ['id', 'shop_name', 'address', 'contact_number', 'images'] // apne fields ke hisab se
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({ success: true, data: bookmarks });

  } catch (error) {
    console.error('listBookmarks error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.loginVendor = async (req, res) => {
  const { mobile, password } = req.body;

  if (!mobile || !password) {
    return res.status(400).json({ success: false, message: 'Contact number and password are required.' });
  }

  try {
    // Find vendor by contact number
    const vendor = await Vendor.findOne({ where: { contact_number: mobile } });

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, vendor.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password.' });
    }

    // Remove password before sending response
    const vendorData = { ...vendor.toJSON() };
    delete vendorData.password;
    vendorData.role = 'Vendor';

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      vendor: vendorData
    });
  } catch (err) {
    console.error('Vendor login error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};


exports.getVendorProfile = async (req, res) => {
  const vendorId = req.params.id;

  try {
    const vendor = await Vendor.findOne({
      where: { id: vendorId },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: Subcategory, as: 'subcategory', attributes: ['id', 'name'] }
      ]
    });

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found.' });
    }

    const vendorData = { ...vendor.toJSON() };
    delete vendorData.password;

    // Add static role
    vendorData.role = 'Vendor';

    return res.status(200).json({
      success: true,
      vendor: vendorData
    });
  } catch (error) {
    console.error('Get Vendor Profile Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

exports.updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      shop_name,
      address,
      city,
      state,
      contact_number,
      facilities,
      category_id,
      subcategory_id,
      verified,
    } = req.body;

    // Find vendor
    const vendor = await Vendor.findByPk(id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    // If updating contact number, check for duplicates
    if (contact_number && contact_number !== vendor.contact_number) {
      const exists = await Vendor.findOne({ where: { contact_number } });
      if (exists) {
        return res.status(409).json({ success: false, message: 'Contact number already registered.' });
      }
    }

    // Handle image updates (merge old + new)
    let updatedImages = vendor.images || [];
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => file.filename);
      updatedImages = [...updatedImages, ...newImages];
    }

    // If password provided, hash it


    // Update vendor fields
    await vendor.update({
      shop_name: shop_name ?? vendor.shop_name,
      address: address ?? vendor.address,
      city: city ?? vendor.city,
      state: state ?? vendor.state,
      contact_number: contact_number ?? vendor.contact_number,
      facilities: facilities ?? vendor.facilities,
      category_id: category_id ?? vendor.category_id,
      subcategory_id: subcategory_id ?? vendor.subcategory_id,
      verified: 0,
      images: updatedImages,
    });

    return res.status(200).json({ success: true, message: 'Vendor updated successfully', vendor });
  } catch (error) {
    console.error('Vendor Update Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
