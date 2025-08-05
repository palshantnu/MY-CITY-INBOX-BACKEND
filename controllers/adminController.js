const bcrypt = require('bcrypt');
const Admin = require('../models/Admin');
const Vendor = require('../models/Vendor');
const SalesExecutive = require('../models/SalesExecutive');
const User = require('../models/User');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const sequelize = require('../config/db');
const fs = require('fs');
const path = require('path');
const Notification = require('../models/Notification');
const { Op } = require('sequelize');
const PageContent = require('../models/PageContent');
const admin = require('../firebase/firebaseAdmin');
const { sendPushToMultipleTokens } = require('../utils/pushNotification');
const Feedback = require('../models/Feedback');
const UserNotification = require('../models/UserNotification');

// Render login page
const renderLogin = (req, res) => {
  // If already logged in, skip login page
  if (req.session.admin) {
    return res.redirect('/admin/dashboard');
  }
  res.render('login', { title: 'Login', layout: false });
};

// Handle login POST
const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ where: { email } });
    if (!admin) {
      return res.render('login', { title: 'Login', layout: false, error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.render('login', { title: 'Login', layout: false, error: 'Invalid email or password' });
    }

    // Store all details for EJS to use (including allotted_section)
    req.session.admin = {
      id: admin.id,
      name: admin.name,
      role: admin.role,
      email: admin.email,
      allotted_section: admin.allotted_section || ''  // <--- ADD THIS
    };

    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('Login error:', err);
    res.render('login', { title: 'Login', layout: false, error: 'Server error' });
  }
};

// Render Dashboard (only for logged-in admins)
const renderDashboard = async (req, res) => {
  try {
    if (!req.session.admin) {
      return res.redirect('/admin/login');
    }
    const totalAdmins = await Admin.count();
    const totalVendors = await Vendor.count();
    const totalSales = await SalesExecutive.count();
    const totalUsers = await User.count();

    // Fetch admin list (for Super Admin only)
    const admins = await Admin.findAll({ attributes: ['name', 'email', 'role'] });
    const vendors = await Vendor.findAll({
      attributes: [
        'id',
        'shop_name',
        'address',
        'contact_number',
        'facilities',
        'city',
        'state',
        'created_at'
      ],
      order: [['created_at', 'DESC']],
      limit: 10000 // show only 10 latest vendors on dashboard
    });
    res.render('dashboard', {
      title: 'Admin Dashboard',
      username: req.session.admin.name,
      role: req.session.admin.role,
      totalAdmins,
      totalVendors,
      totalSales,
      totalUsers,
      admins,
      vendors
    });
  } catch (err) {
    console.error('Error in renderDashboard:', err);
    res.status(500).send('Something went wrong.');
  }
};

const renderVendorsTable = async (req, res) => {
  try {
    if (!req.session.admin) return res.redirect('/admin/login');

    const filter = req.query.source || 'all';
    const search = req.query.search || '';
    const sales_id = req.query.sales_id || ''; // new line
    const fromDate = req.query.from_date;
    const toDate = req.query.to_date;

    const whereClause = {};

    if (filter !== 'all') {
      whereClause.created_by = filter;
    }

    if (sales_id) {
      whereClause.sales_executive_id = sales_id;
    }

    if (search.trim()) {
      whereClause[Op.or] = [
        { shop_name: { [Op.like]: `%${search}%` } },
        { city: { [Op.like]: `%${search}%` } },
        { state: { [Op.like]: `%${search}%` } },
        { contact_number: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } },
        { facilities: { [Op.like]: `%${search}%` } }
      ];
    }
    if (fromDate && toDate) {
      whereClause.created_at = {
        [Op.between]: [new Date(fromDate), new Date(toDate)]
      };
    } else if (fromDate) {
      whereClause.created_at = { [Op.gte]: new Date(fromDate) };
    } else if (toDate) {
      whereClause.created_at = { [Op.lte]: new Date(toDate) };
    }

    const vendors = await Vendor.findAll({
      where: whereClause,
      attributes: [
        'id', 'shop_name', 'address', 'city', 'state', 'contact_number',
        'facilities', 'created_at', 'category_id', 'subcategory_id', 'verified', 'images', 'created_by', 'sales_executive_id'
      ],
      include: [
        { model: Category, as: 'category', attributes: ['name'] },
        { model: Subcategory, as: 'subcategory', attributes: ['name'] },
        { model: SalesExecutive, as: 'sales_executive', attributes: ['id', 'name'] }
      ],
      order: [['created_at', 'DESC']]
    });

    const categories = await Category.findAll({ attributes: ['id', 'name'] });
    const subcategories = await Subcategory.findAll({ attributes: ['id', 'name'] });
    const salesExecutives = await SalesExecutive.findAll({ attributes: ['id', 'name'] }); // new line

    res.render('vendors', {
      title: 'Vendors List',
      layout: 'layout',
      vendors,
      categories,
      subcategories,
      salesExecutives,
      selectedSource: filter,
      search,
      selectedSales: sales_id,
      fromDate,    // pass these to template if you want to show the filter values in UI
      toDate
    });
  } catch (error) {
    console.error('Error loading vendors table:', error);
    res.status(500).send('Server Error');
  }
};



// Add Vendor
const addVendor = async (req, res) => {
  try {
    const {
      shop_name,
      category_id,
      subcategory_id,
      address,
      city,
      state,
      contact_number,
      facilities,
      password,
      created_by = 'admin'
    } = req.body;

    const images = req.files ? req.files.map(file => file.filename) : [];

    // --- Validate Required Fields ---
    if (!shop_name || !category_id || !subcategory_id || !address || !contact_number || !password) {
      return res.send("<script>alert('Please fill all required fields including password!'); window.history.back();</script>");
    }

    // --- Check for Duplicate Contact Number ---
    const existingVendor = await Vendor.findOne({ where: { contact_number } });
    if (existingVendor) {
      return res.send("<script>alert('A vendor with this contact number already exists!'); window.history.back();</script>");
    }

    // --- Hash Password ---
    const hashedPassword = await bcrypt.hash(password, 10);

    // --- Create Vendor ---
    await Vendor.create({
      shop_name,
      category_id,
      subcategory_id,
      address,
      city,
      state,
      contact_number,
      facilities,
      images,
      password: hashedPassword,
      created_by
    });

    res.redirect('/admin/vendors');
  } catch (error) {
    console.error('Error adding vendor:', error);
    res.status(500).send("<script>alert('Failed to add vendor. Try again later.'); window.history.back();</script>");
  }
};


// Edit Vendor
const editVendor = async (req, res) => {
  try {
    const {
      shop_name,
      category_id,
      subcategory_id,
      address,
      city,
      state,
      contact_number,
      facilities,
      delete_images = []
    } = req.body;

    const vendorId = req.params.id;
    const vendor = await Vendor.findByPk(vendorId);

    if (!vendor) {
      return res.status(404).send("<script>alert('Vendor not found.'); window.history.back();</script>");
    }

    // --- Check duplicate contact number for other vendors ---
    const duplicateVendor = await Vendor.findOne({
      where: {
        contact_number,
        id: { [Op.ne]: vendorId }  // exclude current vendor
      }
    });

    if (duplicateVendor) {
      return res.send("<script>alert('Another vendor with this contact number already exists!'); window.history.back();</script>");
    }

    const imagesToDelete = Array.isArray(delete_images) ? delete_images : [delete_images];
    let images = Array.isArray(vendor.images) ? vendor.images : [];

    if (imagesToDelete.length) {
      imagesToDelete.forEach(img => {
        const imgPath = path.join(__dirname, '../public/uploads/vendors', img);
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      });
      images = images.filter(img => !imagesToDelete.includes(img));
    }

    const newImages = req.files ? req.files.map(file => file.filename) : [];
    images = [...images, ...newImages];

    await vendor.update({
      shop_name,
      category_id,
      subcategory_id,
      address,
      city,
      state,
      contact_number,
      facilities,
      images
    });

    res.redirect('/admin/vendors');
  } catch (err) {
    console.error('Error editing vendor:', err);
    res.status(500).send("<script>alert('Failed to update vendor. Try again later.'); window.history.back();</script>");
  }
};



// Toggle vendor verification (AJAX)
const toggleVendorVerification = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await Vendor.findByPk(id, { attributes: ['id', 'verified'] });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    // Toggle status
    const newStatus = vendor.verified ? 0 : 1;
    await Vendor.update({ verified: newStatus }, { where: { id } });

    res.json({ success: true, status: newStatus });
  } catch (error) {
    console.error('Error toggling vendor verification:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete vendor
const deleteVendor = async (req, res) => {
  try {
    await Vendor.destroy({ where: { id: req.params.id } });
    res.redirect('/admin/vendors');
  } catch (err) {
    console.error('Error deleting vendor:', err);
    res.status(500).send('Error deleting vendor');
  }
};
const renderUsersList = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'mobile', 'created_at', 'city', 'state'], // only actual columns
      order: [['created_at', 'DESC']]
    });

    res.render('users', {
      title: 'Users List',
      layout: 'layout',
      users
    });
  } catch (error) {
    console.error('Error loading users:', error);
    res.status(500).send('Server Error');
  }
};
// Logout Admin
const logoutAdmin = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
};

const getSubcategoriesByCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;

    const subcategories = await Subcategory.findAll({
      where: { category_id: categoryId },
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });

    res.json(subcategories); // return as JSON for the frontend
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({ error: 'Failed to fetch subcategories' });
  }
};


const renderCategories = async (req, res) => {
  try {
    if (!req.session.admin) return res.redirect('/admin/login');

    const categories = await Category.findAll({
      attributes: ['id', 'name', 'sort_order', 'image'],
      order: [
        [sequelize.literal('sort_order = 0'), 'ASC'],  // non-zero first
        ['sort_order', 'ASC']                          // then by sort_order
      ]
    });


    res.render('categories', {
      title: 'Manage Categories',
      layout: 'layout',
      categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).send('Server Error');
  }
};

const addCategory = async (req, res) => {
  try {
    const { name, sort_order } = req.body;
    if (!name) {
      return res.send("<script>alert('Category name is required'); window.history.back();</script>");
    }

    let image = null;
    if (req.file) {
      image = req.file.filename;  // or req.file.path if you store full path
    }

    await Category.create({
      name,
      sort_order: sort_order || 0,
      image, // add image filename here
    });

    res.redirect('/admin/categories');
  } catch (error) {
    console.error('Error adding category:', error);
    res.status(500).send('Server Error');
  }
};

// Edit category
const editCategory = async (req, res) => {
  try {
    const { name, sort_order } = req.body;

    const updateData = {
      name,
      sort_order: sort_order || 0,
    };

    if (req.file) {
      updateData.image = req.file.filename; // update image only if a new file is uploaded
    }

    await Category.update(updateData, { where: { id: req.params.id } });

    res.redirect('/admin/categories');
  } catch (error) {
    console.error('Error editing category:', error);
    res.status(500).send('Server Error');
  }
};

// Delete category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await Category.destroy({ where: { id } });
    res.redirect('/admin/categories');
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).send('Server Error');
  }
};

const renderSubcategories = async (req, res) => {
  try {
    if (!req.session.admin) return res.redirect('/admin/login');

    const subcategories = await Subcategory.findAll({
      include: [{ model: Category, as: 'Category', attributes: ['id', 'name', 'image'] }],
      order: [['id', 'DESC']]
    });

    const categories = await Category.findAll({ attributes: ['id', 'name'] }); // For dropdowns

    res.render('subcategories', {
      title: 'Manage Subcategories',
      layout: 'layout',
      subcategories,
      categories
    });
  } catch (error) {
    console.error('Error loading subcategories:', error);
    res.status(500).send('Server Error');
  }
};

// Add subcategory
const addSubcategory = async (req, res) => {
  try {
    const { category_id, name } = req.body;
    let image = null;
    if (req.file) {
      image = req.file.filename;  // or req.file.path if full path stored
    }

    await Subcategory.create({ category_id, name, image });
    res.redirect('/admin/subcategories');
  } catch (error) {
    console.error('Error adding subcategory:', error);
    res.status(500).send('Server Error');
  }
};

// Edit subcategory
const editSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, name } = req.body;

    const updateData = { category_id, name };

    if (req.file) {
      updateData.image = req.file.filename;
    }

    await Subcategory.update(updateData, { where: { id } });
    res.redirect('/admin/subcategories');
  } catch (error) {
    console.error('Error updating subcategory:', error);
    res.status(500).send('Server Error');
  }
};


// Delete subcategory
const deleteSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    await Subcategory.destroy({ where: { id } });
    res.redirect('/admin/subcategories');
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    res.status(500).send('Server Error');
  }
};

const renderSalesList = async (req, res) => {
  try {
    if (!req.session.admin) {
      return res.redirect('/admin/login');
    }

    const sales = await SalesExecutive.findAll({
      attributes: [
        'id', 'name', 'contact_number', 'document_title', 'document_file',
        'bank_name', 'bank_account_name', 'bank_account_number', 'bank_ifsc',
        'bank_passbook_img', 'created_at', 'verified'
      ],
      order: [['created_at', 'DESC']]
    });

    res.render('sales', {
      title: 'Sales Executives',
      layout: 'layout',
      sales
    });
  } catch (err) {
    console.error('Error loading sales executives:', err);
    res.status(500).send('Server Error');
  }
};

// Show Sales Docs list

// Add new SalesDoc
const addSalesDoc = async (req, res) => {
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

    const documentFile = req.files['document_file'] ? req.files['document_file'][0].filename : null;
    const passbookImg = req.files['bank_passbook_img'] ? req.files['bank_passbook_img'][0].filename : null;

    // --- Prevent duplicate contact_number ---
    const existing = await SalesExecutive.findOne({ where: { contact_number } });
    if (existing) {
      return res.send("<script>alert('A Sales Executive with this contact number already exists!'); window.history.back();</script>");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await SalesExecutive.create({
      name,
      contact_number,
      document_title,
      document_file: documentFile,
      bank_name,
      bank_account_name,
      bank_account_number,
      bank_ifsc,
      bank_passbook_img: passbookImg,
      verified: 0,
      password: hashedPassword // <-- Save hashed password
    });

    res.redirect('/admin/sales');
  } catch (error) {
    console.error('Error adding sales doc:', error);
    res.status(500).send('Failed to add document.');
  }
};

// Edit Sales Doc
const editSalesDoc = async (req, res) => {
  try {
    const docId = req.params.id;
    const doc = await SalesExecutive.findByPk(docId);
    if (!doc) return res.status(404).send('Document not found');

    const {
      name,
      contact_number,
      document_title,
      bank_name,
      bank_account_name,
      bank_account_number,
      bank_ifsc
    } = req.body;

    // --- Check duplicate contact_number for other records ---
    const duplicate = await SalesExecutive.findOne({
      where: {
        contact_number,
        id: { [Op.ne]: docId }  // exclude the current record
      }
    });
    if (duplicate) {
      return res.send("<script>alert('Another Sales Executive with this contact number already exists!'); window.history.back();</script>");
    }

    // Replace document file if uploaded
    if (req.files['document_file'] && req.files['document_file'][0]) {
      if (doc.document_file) {
        const oldPath = path.join(__dirname, '../public/uploads/documents', doc.document_file);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      doc.document_file = req.files['document_file'][0].filename;
    }

    // Replace passbook file if uploaded
    if (req.files['bank_passbook_img'] && req.files['bank_passbook_img'][0]) {
      if (doc.bank_passbook_img) {
        const oldPath = path.join(__dirname, '../public/uploads/documents', doc.bank_passbook_img);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      doc.bank_passbook_img = req.files['bank_passbook_img'][0].filename;
    }

    await doc.update({
      name,
      contact_number,
      document_title,
      bank_name,
      bank_account_name,
      bank_account_number,
      bank_ifsc,
      document_file: doc.document_file,
      bank_passbook_img: doc.bank_passbook_img
    });

    res.redirect('/admin/sales');
  } catch (error) {
    console.error('Error editing sales doc:', error);
    res.status(500).send('Failed to edit document.');
  }
};

// Delete SalesDoc
const deleteSalesDoc = async (req, res) => {
  try {
    const doc = await SalesExecutive.findByPk(req.params.id);
    if (!doc) return res.redirect('/admin/sales');

    // Delete files
    if (doc.document_file) {
      const docPath = path.join(__dirname, '../public/uploads/documents', doc.document_file);
      if (fs.existsSync(docPath)) fs.unlinkSync(docPath);
    }
    if (doc.bank_passbook_img) {
      const passbookPath = path.join(__dirname, '../public/uploads/documents', doc.bank_passbook_img);
      if (fs.existsSync(passbookPath)) fs.unlinkSync(passbookPath);
    }

    await doc.destroy();
    res.redirect('/admin/sales');
  } catch (error) {
    console.error('Error deleting sales doc:', error);
    res.status(500).send('Failed to delete document.');
  }
};

// Toggle Verify
const toggleVerifySalesDoc = async (req, res) => {
  try {
    const { id } = req.params;


    const sales = await SalesExecutive.findByPk(id, { attributes: ['id', 'verified'] });

    if (!sales) {
      return res.status(404).json({ success: false, message: 'sales not found' });
    }

    // Toggle status
    const newStatus = sales.verified ? 0 : 1;
    await SalesExecutive.update({ verified: newStatus }, { where: { id } });

    res.json({ success: true, status: newStatus });
  } catch (error) {
    console.error('Error toggling sales verification:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}


// Show Subadmins List
const renderSubadmins = async (req, res) => {
  try {
    const subadmins = await Admin.findAll({ where: { role: 'sub_admin' }, raw: true });
    res.render('subadmins', { layout: 'layout', subadmins, title: 'Subadmins' });
  } catch (err) {
    console.error('Error fetching subadmins:', err);
    res.render('subadmins', { layout: 'layout', subadmins: [], title: 'Subadmins' });
  }
};

// Add Subadmin
const addSubadmin = async (req, res) => {
  try {
    const { name, email, mobile, password, allotted_section } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const sections = Array.isArray(req.body.allotted_section)
      ? req.body.allotted_section.join(',')
      : req.body.allotted_section;
    await Admin.create({
      role: 'sub_admin',
      name,
      email,
      mobile,
      password: hashed,
      allotted_section: sections
    });
    res.redirect('/admin/subadmins');
  } catch (err) {
    console.error('Error adding subadmin:', err);
    res.redirect('/admin/subadmins');
  }
};

// Edit Subadmin
const editSubadmin = async (req, res) => {
  try {
    const { name, email, mobile, allotted_section } = req.body;
    const { id } = req.params;
    const sections = Array.isArray(req.body.allotted_section)
      ? req.body.allotted_section.join(',')
      : req.body.allotted_section;
    await Admin.update(
      { name, email, mobile, allotted_section: sections },
      { where: { id, role: 'sub_admin' } }
    );
    res.redirect('/admin/subadmins');
  } catch (err) {
    console.error('Error editing subadmin:', err);
    res.redirect('/admin/subadmins');
  }
};

// Delete Subadmin
const deleteSubadmin = async (req, res) => {
  try {
    const { id } = req.params;
    await Admin.destroy({ where: { id, role: 'sub_admin' } });
    res.redirect('/admin/subadmins');
  } catch (err) {
    console.error('Error deleting subadmin:', err);
    res.redirect('/admin/subadmins');
  }
};

// List
const listNotifications = async (req, res) => {
  const notifications = await Notification.findAll({ order: [['created_at', 'DESC']] });
  res.render('notifications', { title: 'Notifications', notifications, admin: req.session.admin });
};

// Add
const addNotification = async (req, res) => {
  const { title, message } = req.body;
  const image = req.file ? req.file.filename : null;

  const t = await sequelize.transaction();
  try {
    // 1) create notification
    const created = await Notification.create({ title, message, image }, { transaction: t });
    const notificationId = created.id;

    // 2) get users (you can change to get ALL users or only users with device tokens)
    const users = await User.findAll({
      attributes: ['id', 'device_token'],
      where: { /* optional filters */ },
      raw: true,
      transaction: t
    });

    // 3) prepare bulk rows for user_notifications
    const rows = users.map(u => ({
      user_id: u.id,
      notification_id: notificationId,
      seen: false,
      seen_at: null
    }));

    if (rows.length) {
      await UserNotification.bulkCreate(rows, { transaction: t });
    }

    // 4) commit before sending push (so DB has record)
    await t.commit();

    // 5) send push to tokens (do not block DB now)
    const tokens = users.map(u => u.device_token).filter(Boolean);
    const imageUrl = image ? `${process.env.BASE_URL || 'http://192.168.29.53:5050'}/uploads/notifications/${image}` : null;
    if (tokens.length) {
      // keeping it async; await if you want to make push delivery blocking
      sendPushToMultipleTokens(tokens, title, message, imageUrl)
        .catch(err => console.error('Push send error:', err));
    }

    return res.redirect('/admin/notifications');
  } catch (err) {
    await t.rollback();
    console.error('Notification Error:', err);
    return res.status(500).send('Failed to send notification.');
  }
};

// Edit
const editNotification = async (req, res) => {
  const { title, message } = req.body;
  const image = req.file ? req.file.filename : undefined;

  try {
    const notif = await Notification.findByPk(req.params.id);
    if (!notif) return res.redirect('/admin/notifications');

    // Update DB fields
    notif.title = title;
    notif.message = message;
    if (image) notif.image = image;
    await notif.save();

    // Fetch user device tokens
    const users = await User.findAll({
      attributes: ['device_token'],
      where: {
        device_token: {
          [Op.ne]: null
        }
      },
      raw: true
    });

    const tokens = users.map(u => u.device_token).filter(Boolean);

    // Full image URL if present
    const imageUrl = image
      ? `${process.env.BASE_URL || 'http://192.168.29.53:5050'}/uploads/notifications/${image}`
      : notif.image
      ? `${process.env.BASE_URL || 'http://192.168.29.53:5050'}/uploads/notifications/${notif.image}`
      : null;

    // Send push to all tokens
    await sendPushToMultipleTokens(tokens, title, message, imageUrl);

    res.redirect('/admin/notifications');
  } catch (error) {
    console.error('Error editing notification and sending push:', error);
    res.status(500).send('Server error while editing notification');
  }
};

// Delete
const deleteNotification = async (req, res) => {
  await Notification.destroy({ where: { id: req.params.id } });
  res.redirect('/admin/notifications');
};



// Render the edit form with existing content or create new record if missing
const renderEditor = async (req, res) => {
  const { key } = req.params;

  try {
    let page = await PageContent.findOne({ where: { key } });

    if (!page) {
      page = await PageContent.create({
        key,
        title: key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '),
        content: '',
      });
    }

    // ✅ Fix: add "title" for layout.ejs
    res.render('pageContent', {
      page,
      title: `${page.title} Editor`,
      layout: 'layout', // optional, if you're using express-ejs-layouts
    });
  } catch (error) {
    console.error('Error rendering editor:', error);
    res.status(500).send('Server error');
  }
};

const saveContent = async (req, res) => {
  const { key } = req.params;
  const { title, content } = req.body;

  try {
    let page = await PageContent.findOne({ where: { key } });

    if (page) {
      await page.update({ title, content });
    } else {
      page = await PageContent.create({ key, title, content });
    }

    res.redirect(`/admin/pages/${key}`);
  } catch (error) {
    console.error('Error saving content:', error);
    res.status(500).send('Server error');
  }
};




const renderFeedbackListPage = async (req, res) => {
  try {
    const admin = req.user || res.locals.admin || null;

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const q = (req.query.q || '').trim();

    const where = {};
    if (q) {
      const { Op } = require('sequelize');
      where[Op.or] = [
        { name: { [Op.like]: `%${q}%` } },
        { email: { [Op.like]: `%${q}%` } },
        { subject: { [Op.like]: `%${q}%` } }
      ];
    }

    const offset = (page - 1) * limit;
    const { count, rows } = await Feedback.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    res.render('admin_feedback_list', {
      title: 'Feedback List',
      admin,
      feedbacks: rows.map(f => f.get({ plain: true })),
      meta: { total: count, page, limit },
      q,
      status: req.query.status || ''
    });
  } catch (err) {
    console.error('Error rendering feedback page', err);
    res.status(500).send('Server error');
  }
};

module.exports = {
  renderLogin,
  loginAdmin,
  renderDashboard,
  logoutAdmin,
  renderVendorsTable,
  renderUsersList,
  addVendor,
  editVendor,
  deleteVendor,
  renderCategories,
  addCategory,
  editCategory,
  deleteCategory,
  renderSubcategories,
  addSubcategory,
  editSubcategory,
  deleteSubcategory,
  getSubcategoriesByCategory,
  toggleVendorVerification,
  renderSalesList,
  addSalesDoc,
  editSalesDoc,
  deleteSalesDoc,
  toggleVerifySalesDoc,
  renderSubadmins,
  addSubadmin,
  editSubadmin,
  deleteSubadmin,
  listNotifications,
  addNotification,
  editNotification,
  deleteNotification,
  renderEditor,
  saveContent,
  renderFeedbackListPage
};
