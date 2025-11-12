import fs from 'fs';
import { success, error } from '../utils/response.js';
import * as TestImportService from '../services/testImport.service.js';

/**
 * Import test from Excel file
 * POST /api/admin/tests/import
 */
export const importTestFromExcel = async (req, res) => {
  let filePath = null;

  try {
    // Check admin permission
    if (req.user.role !== 'admin') {
      return error(res, 'Không có quyền truy cập', 403);
    }

    // Check if file was uploaded
    if (!req.file) {
      return error(res, 'Vui lòng upload file Excel', 400);
    }

    // Validate form data
    const { title, testCode, audio, description, isActive, isPremium, isFeatured, isOfficial } = req.body;

    if (!title?.trim()) {
      return error(res, 'Tiêu đề test là bắt buộc', 400);
    }

    if (!testCode?.trim()) {
      return error(res, 'Mã test là bắt buộc', 400);
    }

    if (!audio?.trim()) {
      return error(res, 'URL audio là bắt buộc', 400);
    }

    filePath = req.file.path;

    // Validate Excel structure
    const structureValidation = TestImportService.validateExcelStructure(filePath);
    if (!structureValidation.valid) {
      return error(res, `Cấu trúc file Excel không hợp lệ: ${structureValidation.error}`, 400);
    }

    // Prepare test data
    const testData = {
      title,
      testCode,
      audio,
      // description: description || '',
      // isActive: isActive === 'true' || isActive === true,
      // isPremium: isPremium === 'true' || isPremium === true,
      // isFeatured: isFeatured === 'true' || isFeatured === true,
      // isOfficial: isOfficial === 'true' || isOfficial === true
    };

    // Import test
    const result = await TestImportService.importTestFromExcel(filePath, testData, req.user.id);

    return success(res, 'Import test thành công', result);

  } catch (err) {
    console.error('Import test error:', err);
    return error(res, err.message || 'Lỗi khi import test', 500);
  } finally {
    // Clean up uploaded file
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
  }
};

/**
 * Download Excel template
 * GET /api/admin/tests/import/template
 */
export const downloadExcelTemplate = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return error(res, 'Không có quyền truy cập', 403);
    }

    const templatePath = 'src/templates/test-import-template.xlsx';

    if (!fs.existsSync(templatePath)) {
      return error(res, 'Template file không tồn tại', 404);
    }

    res.download(templatePath, 'toeic-test-import-template.xlsx', (err) => {
      if (err) {
        console.error('Error downloading template:', err);
        return error(res, 'Lỗi khi tải template', 500);
      }
    });

  } catch (err) {
    console.error('Download template error:', err);
    return error(res, err.message || 'Lỗi khi tải template', 500);
  }
};
