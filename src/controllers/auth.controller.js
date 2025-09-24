import { success, error } from '../utils/response.js'
import * as AuthService from '../services/user.service.js'

// Login
export const login = async (req, res) => {
    try {
        const user  = await AuthService.login(req.body);

        return success(res, 'Login successfull', { 
        user: { fullName: user.fullName, email: user.email, phone: user.phone, avatarUrl : user.avatarUrl, role: user.role },});
    } catch (err) {
        return error(res, err.message, 400);
    }
};