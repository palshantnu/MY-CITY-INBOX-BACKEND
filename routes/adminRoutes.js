const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const stateCityController = require('../controllers/stateCityController');
const multer = require('multer');
const path = require('path');
const sliderController = require('../controllers/sliderController');

// === Categories Multer Config ===
const storageCategories = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/categories');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const uploadCategories = multer({ storage: storageCategories });

// === Subcategories Multer Config ===
const storageSubcategories = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/subcategories');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const uploadSubcategories = multer({ storage: storageSubcategories });
// === Vendors Multer Config ===
const storageVendors = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/vendors'); 
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const uploadVendors = multer({ storage: storageVendors });

// === Sales Documents Multer Config ===
const storageSalesDocs = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/sales');  // keep docs separate
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const uploadSalesDocs = multer({ storage: storageSalesDocs });

const storageSliders = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/sliders');  // keep sliders separate
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const uploadSliders = multer({ storage: storageSliders });

const storageNotifications = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/notifications');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const uploadNotifications = multer({ storage: storageNotifications });

// Middleware for authentication
function requireAuth(req, res, next) {
  if (!req.session || !req.session.admin) {
    return res.redirect('/admin/login');
  }
  next();
}

// === Auth Routes ===
router.get('/login', adminController.renderLogin);
router.post('/login', adminController.loginAdmin);
router.get('/logout', adminController.logoutAdmin);

// === Dashboard & Lists ===
router.get('/dashboard', requireAuth, adminController.renderDashboard);
router.get('/users', requireAuth, adminController.renderUsersList);
router.get('/vendors', requireAuth, adminController.renderVendorsTable);

// === Vendor CRUD ===
router.post('/vendors/add', requireAuth, uploadVendors.array('images[]', 10), adminController.addVendor);
router.post('/vendors/edit/:id', requireAuth, uploadVendors.array('images[]', 10), adminController.editVendor);
router.post('/vendors/toggle-verify/:id', requireAuth, adminController.toggleVendorVerification);
router.post('/vendors/delete/:id', requireAuth, adminController.deleteVendor);

// === Categories & Subcategories ===
router.get('/categories', requireAuth, adminController.renderCategories);
// === Categories Routes (With Image) ===
router.post('/categories/add', requireAuth, uploadCategories.single('image'), adminController.addCategory);
router.post('/categories/edit/:id', requireAuth, uploadCategories.single('image'), adminController.editCategory);
router.post('/categories/delete/:id', requireAuth, adminController.deleteCategory);

router.get('/subcategories/:categoryId', requireAuth, adminController.getSubcategoriesByCategory);
router.get('/subcategories', requireAuth, adminController.renderSubcategories);
// === Subcategories Routes (With Image) ===
router.post('/subcategories/add', requireAuth, uploadSubcategories.single('image'), adminController.addSubcategory);
router.post('/subcategories/edit/:id', requireAuth, uploadSubcategories.single('image'), adminController.editSubcategory);
router.post('/subcategories/delete/:id', requireAuth, adminController.deleteSubcategory);

// === Sales Documents (Sales Module) ===
router.get('/sales', requireAuth, adminController.renderSalesList);
router.post('/sales/add', requireAuth,
  uploadSalesDocs.fields([
    { name: 'document_file', maxCount: 1 },
    { name: 'bank_passbook_img', maxCount: 1 }
  ]),
  adminController.addSalesDoc
);
router.post('/sales/edit/:id', requireAuth,
  uploadSalesDocs.fields([
    { name: 'document_file', maxCount: 1 },
    { name: 'bank_passbook_img', maxCount: 1 }
  ]),
  adminController.editSalesDoc
);
router.post('/sales/delete/:id', requireAuth, adminController.deleteSalesDoc);
router.post('/sales/toggle-verify/:id', requireAuth, adminController.toggleVerifySalesDoc);


router.get('/subadmins', requireAuth, adminController.renderSubadmins);
router.post('/subadmins/add', requireAuth, adminController.addSubadmin);
router.post('/subadmins/edit/:id', requireAuth, adminController.editSubadmin);
router.post('/subadmins/delete/:id', requireAuth, adminController.deleteSubadmin);


router.get('/sliders', requireAuth,sliderController.listSliders);
router.post('/sliders/add', requireAuth,uploadSliders.single('image'), sliderController.addSlider);
router.post('/sliders/edit/:id', requireAuth,uploadSliders.single('image'), sliderController.editSlider);
router.post('/sliders/delete/:id', requireAuth,sliderController.deleteSlider);

// Notifications
router.get('/notifications', requireAuth,adminController.listNotifications);
router.post('/notifications/add', requireAuth,uploadNotifications.single('image'), adminController.addNotification);
router.post('/notifications/edit/:id', requireAuth,uploadNotifications.single('image'), adminController.editNotification);
router.post('/notifications/delete/:id', requireAuth,adminController.deleteNotification);


router.get('/states', stateCityController.getStates);
router.get('/cities/:state', stateCityController.getCitiesByState);


// Admin page editor (GET form)
router.get('/pages/:key',requireAuth, adminController.renderEditor);

// Save/update page content (POST form)
router.post('/pages/:key',requireAuth, adminController.saveContent);
// Feedback list (admin)
router.get('/feedback', requireAuth, adminController.renderFeedbackListPage);


// === Other Demo Pages ===
router.get('/tables', requireAuth, (req, res) =>
  res.render('tables', { title: 'Tables', layout: 'layout' })
);
router.get('/charts', requireAuth, (req, res) =>
  res.render('charts', { title: 'Charts', layout: 'layout' })
);

// Default route (redirect to login or dashboard)
router.get('/', (req, res) => {
  if (!req.session || !req.session.admin) {
    return res.redirect('/admin/login');
  }
  res.redirect('/admin/dashboard');
});

module.exports = router;
