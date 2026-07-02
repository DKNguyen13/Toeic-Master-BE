import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { success, error } from '../utils/response.js';
import * as TestImportService from '../services/testImport.service.js';
import { putObject } from '../utils/putObject.js';

/**
 * Import test from Excel file
 * POST /api/admin/tests/import
 * Accepts multipart/form-data with:
 *   - file: Excel file (.xlsx / .xls)
 *   - audio: Audio file (MP3, WAV, M4A, etc.) – uploaded to S3
 *   - title: string
 */
export const importTestFromExcel = async (req, res) => {
  let filePath = null;

  try {
    // Check admin permission
    if (req.user.role !== 'admin') {
      return error(res, 'Không có quyền truy cập', 403);
    }

    // req.files is populated by multer .fields()
    const excelFileArr = req.files?.file;
    const audioFileArr = req.files?.audio;

    // Check if Excel file was uploaded
    if (!excelFileArr || excelFileArr.length === 0) {
      return error(res, 'Vui lòng upload file Excel', 400);
    }

    // Validate form data
    const { title, description, isActive } = req.body;

    if (!title?.trim()) {
      return error(res, 'Tên đề thi là bắt buộc', 400);
    }

    // Audio is now required as a file upload
    if (!audioFileArr || audioFileArr.length === 0) {
      return error(res, 'Vui lòng upload file audio cho đề thi', 400);
    }

    // Excel file is stored on disk
    const excelFile = excelFileArr[0];
    filePath = excelFile.path;

    // Validate Excel structure
    const structureValidation = TestImportService.validateExcelStructure(filePath);
    if (!structureValidation.valid) {
      return error(res, `Cấu trúc file Excel không hợp lệ: ${structureValidation.error}`, 400);
    }

    // Upload audio to S3
    const audioFile = audioFileArr[0];
    const ext = path.extname(audioFile.originalname).toLowerCase();
    const s3Key = `audio/${uuidv4()}${ext}`;

    const { url: audioUrl } = await putObject(audioFile.buffer, s3Key);

    if (!audioUrl) {
      return error(res, 'Không thể upload file audio lên S3', 500);
    }

    // Prepare test data
    const testData = {
      title,
      audio: audioUrl,
      description: description || null,
      isActive: isActive === 'true' || isActive === true,
    };

    // Import test from Excel
    const result = await TestImportService.importTestFromExcel(filePath, testData, req.user.id);

    return success(res, 'Import test thành công', result);

  } catch (err) {
    console.error('Import test error:', err);
    return error(res, err.message || 'Lỗi khi import test', 500);
  } finally {
    // Clean up uploaded Excel file from disk
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
