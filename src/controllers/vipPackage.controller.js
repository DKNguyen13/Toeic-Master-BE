import { success, error } from '../utils/response.js';
import * as PackageService from '../services/vipPackage.service.js';

// Get all premium packages
export const getAllPackages = async (req, res) => {
  try {
    const packages = await PackageService.getAllPackages();
    return success(res, 'Danh sách gói VIP', packages);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// Get a single premium package by ID
export const getPackageById = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return error(res, 'Không có quyền truy cập', 403);
    const pkg = await PackageService.getPackageById(req.params.id);
    return success(res, 'Chi tiết gói VIP', pkg);
  } catch (err) {
    return error(res, err.message, 404);
  }
};

// Update a premium package by ID
export const updatePackage = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return error(res, 'Không có quyền truy cập', 403);
    const pkg = await PackageService.updatePackage(req.params.id, req.body);
    return success(res, 'Cập nhật gói VIP thành công', pkg);
  } catch (err) {
    return error(res, err.message, 400);
  }
};
