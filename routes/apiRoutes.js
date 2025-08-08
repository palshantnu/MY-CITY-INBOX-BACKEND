const express = require('express');
const router = express.Router();
const { getUsers, register, login, getStates, getCitiesByState, registerVendor, getCategories, getSubcategories, registerSalesExecutive, getAllCategories, getVendorsByCityState, getSlider, getVendorsFiltered, getPageByKey, getUserProfile, updateUserProfile, createFeedback, markNotificationSeen, markNotificationsSeen, getNotificationCount, getNotifications, listBookmarks, addBookmark, removeBookmark, loginVendor, getVendorProfile, updateVendor } = require('../controllers/apiController');
const multer = require('multer');
const path = require('path');
const { submitRating, getVendorReviews } = require('../controllers/ratingController');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/uploads/vendors/');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
  const upload = multer({ storage });

const storageSalesDocs = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/sales');  // keep docs separate
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const uploadSalesDocs = multer({ storage: storageSalesDocs });

router.post('/users-register', register);
router.post('/users-login', login);

router.post('/vendor-login',loginVendor);
router.get('/vendor/:id', getVendorProfile);
router.put('/vendor-update/:id', upload.array('images', 10), updateVendor);
router.post('/vendors/register', upload.array('images', 10), registerVendor);


router.post(
    '/sales/register',
    uploadSalesDocs.fields([
      { name: 'document_file', maxCount: 1 },
      { name: 'bank_passbook_img', maxCount: 1 }
    ]),
    registerSalesExecutive
  );
  

router.get('/categories', getCategories);
router.get('/subcategories/:category_id', getSubcategories);

router.post('/vendors', getVendorsByCityState);
router.get('/app_sliders', getSlider);
router.get('/states', getStates);
router.post('/rate-vendor', submitRating);
router.post('/vendor-category-wise', getVendorsFiltered);
router.get('/vendor-rating/:id',getVendorReviews);
router.get('/pages/:key', getPageByKey);

// GET /api/user/profile?id=1
router.get('/profile', getUserProfile);

// PUT /api/user/update-profile
router.put('/update-profile', updateUserProfile);
router.put('/seen/all', markNotificationsSeen);
router.post('/notification-count', getNotificationCount);
router.get('/notification', getNotifications);



router.post('/bookmark/add', addBookmark);
router.delete('/bookmark/remove', removeBookmark);
router.get('/bookmark/list', listBookmarks);

router.post('/help-feedback', createFeedback);
// Route to get cities by state
router.get('/cities', getCitiesByState);
module.exports = router;
