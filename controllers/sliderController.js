const Slider = require('../models/Slider');
const fs = require('fs');
const path = require('path');

// List all sliders
exports.listSliders = async (req, res) => {
  try {
    const sliders = await Slider.findAll({ order: [['created_at', 'DESC']] });
    res.render('sliders', { sliders, title: 'App Sliders' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// Add new slider
exports.addSlider = async (req, res) => {
  try {
    if (!req.file) return res.redirect('/admin/sliders?error=No file selected');

    await Slider.create({
      image_path: req.file.filename,
    });
    res.redirect('/admin/sliders');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// Edit slider (replace image if uploaded)
exports.editSlider = async (req, res) => {
  try {
    const slider = await Slider.findByPk(req.params.id);
    if (!slider) return res.redirect('/admin/sliders?error=Not found');

    let newPath = slider.image_path;
    if (req.file) {
      // delete old file
      const oldPath = path.join(__dirname, '../public/uploads/sliders', slider.image_path);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      newPath = req.file.filename;
    }

    await slider.update({ image_path: newPath });
    res.redirect('/admin/sliders');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// Delete slider
exports.deleteSlider = async (req, res) => {
  try {
    const slider = await Slider.findByPk(req.params.id);
    if (!slider) return res.redirect('/admin/sliders?error=Not found');

    const oldPath = path.join(__dirname, '../public/uploads/sliders', slider.image_path);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);

    await slider.destroy();
    res.redirect('/admin/sliders');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};
