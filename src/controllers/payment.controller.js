import moment from "moment";
import crypto from "crypto";
import User from "../models/user.model.js";
import { config } from "../config/env.config.js";
import { success, error } from '../utils/response.js';
import VipPackage from "../models/vipPackage.model.js";
import PaymentOrder from "../models/paymentOrder.model.js";

// Sort + encode giống VNPay gốc
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).map(k => encodeURIComponent(k)).sort();
  for (const key of keys) {
    sorted[key] = encodeURIComponent(obj[decodeURIComponent(key)]).replace(/%20/g, "+");
  }
  return sorted;
}

// HMAC SHA512
function hmacSHA512(key, data) {
  return crypto.createHmac("sha512", key).update(Buffer.from(data, "utf-8")).digest("hex");
}

// Hash tất cả fields kiểu VNPay
function hashAllFields(fields, secretKey) {
  const sortedFields = sortObject(fields);
  const signData = Object.entries(sortedFields)
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  return hmacSHA512(secretKey, signData);
}

export const createPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { packageId } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const pkg = await VipPackage.findById(packageId);
    if (!pkg) return res.status(400).json({ message: "Package not found" });
    
    const { vnp_TmnCode, vnp_HashSecret, vnp_Url, vnp_ReturnUrl } = config;

    const now = new Date();

    if (user.vip && user.vip.isActive && user.vip.endDate && user.vip.endDate > now) {
        console.log(`User vẫn còn gói VIP đến ${user.vip.endDate}`);
        return res.status(400).json({
            message: `Bạn vẫn còn gói VIP đang chạy đến ${user.vip.endDate.toLocaleDateString()}`,
      });
    }
    
    const createDate = moment(now).format("YYYYMMDDHHmmss");
    const orderId = Date.now().toString(); // duy nhất

    let ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      "127.0.0.1";

    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode,
      vnp_Locale: "vn",
      vnp_CurrCode: "VND",
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toan goi ${pkg.name} cho user ${userId}`,
      vnp_OrderType: "other",
      vnp_Amount: pkg.discountedPrice * 100,
      vnp_ReturnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    const paymentOrder = new PaymentOrder({
      orderId,
      userId,
      packageId,
      pricePaid: pkg.discountedPrice,
      status: "pending",
      isActive: false,
    });
    await paymentOrder.save();

    vnp_Params["vnp_SecureHash"] = hashAllFields(vnp_Params, vnp_HashSecret);

    const queryString = Object.entries(vnp_Params)
      .map(([k, v]) => `${k}=${v}`)
      .join("&");

    const paymentUrl = `${vnp_Url}?${queryString}`;

    return res.json({ paymentUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

export const returnPayment = async (req, res) => {
  try {
    const vnp_Params = { ...req.query };
    const secureHash = vnp_Params.vnp_SecureHash;

    delete vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHashType;

    const signed = hashAllFields(vnp_Params, config.vnp_HashSecret);
    const orderId = vnp_Params.vnp_TxnRef;

    if (!orderId) return res.redirect(`${config.frontendUrl}${config.paymentFailPath}`);

    const order = await PaymentOrder.findOne({ orderId });
    if (!order) return res.redirect(`${config.frontendUrl}${config.paymentFailPath}`);

    if (secureHash !== signed || vnp_Params.vnp_ResponseCode !== "00") {
      await PaymentOrder.findOneAndUpdate({ orderId }, { status: "fail", isActive: false });
      return res.redirect(`${config.frontendUrl}${config.paymentFailPath}`);
    }

    const user = await User.findById(order.userId);
    const pkg = await VipPackage.findById(order.packageId);
    if (!pkg) return res.redirect(`${config.frontendUrl}${config.paymentFailPath}`);

    const now = new Date();
    const currentEnd = user.vip?.endDate && user.vip.endDate > now ? new Date(user.vip.endDate) : new Date(now);

    const newEndDate = new Date(currentEnd);
    newEndDate.setMonth(newEndDate.getMonth() + pkg.durationMonths);

    order.startDate = now;
    order.endDate = newEndDate;


    await User.findByIdAndUpdate(user._id, {
      "vip.isActive": true,
      "vip.type": pkg.type,
      "vip.endDate": newEndDate,
    });

    order.status = "success";
    order.isActive = true;
    order.startDate = now;
    order.endDate = newEndDate;
    await order.save();

    return res.redirect(`${config.frontendUrl}${config.paymentSuccessPath}`);
  } catch (err) {
    console.error(err);
    return res.redirect(`${config.frontendUrl}${config.paymentFailPath}`);
  }
};

// Get user purchase history
export const getUserPurchaseHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await PaymentOrder.find({ userId })
      .populate("packageId", "name durationMonths discountedPrice type")
      .sort({ createdAt: -1 });

    const formattedOrders = orders.map((o) => ({
      _id: o._id,
      orderId: o.orderId,
      packageName: o.packageId.name,
      startDate: o.startDate,
      endDate: o.endDate,
      pricePaid: o.pricePaid,
      status: o.status,
      isActive: o.isActive,
    }));

    return success(res, "Lấy lịch sử mua hàng thành công", formattedOrders);
  } catch (err) {
    console.error(err);
    return error(res, "Lỗi khi lấy lịch sử mua hàng");
  }
};