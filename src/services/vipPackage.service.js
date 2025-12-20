import vipPackageModel from '../models/vipPackage.model.js';

// Get all packages
export const getAllPackages = async () => {
  const packages = await vipPackageModel.find();
  const order = ["basic", "advanced", "premium"];
  return packages.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
};

// Get package by id
export const getPackageById = async (id) => {
  const pkg = await vipPackageModel.findById(id);
  if (!pkg) throw new Error('Gói không tồn tại');
  return pkg;
};

// Update data
export const updatePackage = async (id, data) => {
  const allowedUpdates = { originalPrice: data.originalPrice, discountedPrice: data.discountedPrice, description: data.description };

  if (isNaN(allowedUpdates.originalPrice) || isNaN(allowedUpdates.discountedPrice)) throw new Error('Giá phải là số hợp lệ');

  if (allowedUpdates.discountedPrice > allowedUpdates.originalPrice) throw new Error('Giá giảm không được lớn hơn giá gốc');

  if (allowedUpdates.originalPrice > 1_000_000_000 || allowedUpdates.discountedPrice > 1_000_000_000) throw new Error('Giá quá lớn, vui lòng nhập giá trị hợp lý');

  const pkg = await vipPackageModel.findByIdAndUpdate(id, allowedUpdates, { new: true });
  if (!pkg) throw new Error('Gói không tồn tại');
  return pkg;
};
