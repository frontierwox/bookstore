const nodemailer = require('nodemailer');

// Email configuration
const emailConfig = {
  service: process.env.EMAIL_SERVICE || 'gmail',
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
};

// Create transporter based on service type
const createTransporter = () => {
  // If using SendGrid
  if (process.env.EMAIL_SERVICE === 'sendgrid') {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  }

  // If using custom SMTP
  if (process.env.EMAIL_SERVICE === 'smtp') {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // Default Gmail configuration
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

const transporter = createTransporter();

// Helper for currency formatting inside templates
const formatCurrency = (amount) => `₹${amount.toLocaleString('en-IN')}`;

// Email templates
const emailTemplates = {
  adminNotification: (order) => ({
    subject: `[New Order] #${order.orderNumber} - ₹${order.totalAmount}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #e0e0e0;">
        <div style="background-color: #333; padding: 15px; text-align: center;">
          <h2 style="color: #fff; margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 1px;">Admin Notification</h2>
        </div>
        
        <div style="padding: 20px;">
          <h3 style="border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; margin-top: 0;">Order Summary</h3>
          <table style="width: 100%; font-size: 14px; margin-bottom: 20px;">
            <tr><td style="padding: 5px 0; color: #666;">Order ID:</td><td style="font-weight: bold;">${order.orderNumber}</td></tr>
            <tr><td style="padding: 5px 0; color: #666;">Date:</td><td>${new Date(order.createdAt).toLocaleDateString()}</td></tr>
            <tr><td style="padding: 5px 0; color: #666;">Customer:</td><td>${order.shippingAddress?.name || 'Guest'}</td></tr>
            <tr><td style="padding: 5px 0; color: #666;">Email:</td><td>${order.user?.email || order.customerEmail}</td></tr>
            <tr><td style="padding: 5px 0; color: #666;">Total:</td><td style="color: #2e7d32; font-weight: bold;">${formatCurrency(order.totalAmount)}</td></tr>
          </table>

          <h3 style="border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">Order Items</h3>
          <ul style="padding-left: 20px; font-size: 14px; line-height: 1.6;">
            ${(order.items || []).map(i => `
              <li>
                <strong>${i.name}</strong> 
                <br><span style="color: #666;">Qty: ${i.quantity} | Color: ${i.selectedColor || 'N/A'}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `
  }),

  paymentConfirmed: (order) => ({
    subject: `Payment Receipt - ${order.orderNumber}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; background-color: #ffffff;">
        <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-bottom: 1px solid #e0e0e0;">
          <h1 style="color: #333; margin: 0; font-family: serif;">SareeWeb</h1>
          <p style="color: #666; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin-top: 5px;">Payment Success</p>
        </div>

        <div style="padding: 30px;">
          <p style="font-size: 16px; line-height: 1.5; color: #333;">
            Dear <strong>${order.shippingAddress?.name || 'Customer'}</strong>,<br><br>
            We confirm that your payment for order <strong>${order.orderNumber}</strong> has been successfully processed.
          </p>

          <div style="background-color: #f1f8e9; border: 1px solid #c5e1a5; padding: 20px; margin: 25px 0; border-radius: 4px;">
            <table style="width: 100%;">
              <tr>
                <td style="color: #33691e; font-weight: bold; font-size: 18px;">Total Paid</td>
                <td style="text-align: right; color: #33691e; font-weight: bold; font-size: 18px;">${formatCurrency(order.totalAmount)}</td>
              </tr>
              <tr>
                <td style="color: #558b2f; font-size: 13px; padding-top: 5px;">Payment Method</td>
                <td style="text-align: right; color: #558b2f; font-size: 13px; padding-top: 5px; text-transform: uppercase;">${order.paymentMethod}</td>
              </tr>
            </table>
          </div>

          <p style="color: #666; font-size: 13px; text-align: center;">
            This email serves as your official payment receipt.
          </p>
        </div>
      </div>
    `
  }),

  orderConfirmation: (order) => ({
    subject: `Order Confirmation - ${order.orderNumber}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; background-color: #ffffff;">
        
        <div style="background-color: #f8f9fa; padding: 30px 20px; text-align: center; border-bottom: 1px solid #eee;">
          <h1 style="color: #1a1a1a; margin: 0; font-family: serif; font-size: 28px;">SareeWeb</h1>
          <p style="color: #666; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; margin: 5px 0 0 0;">Order Acknowledgment</p>
        </div>
        
        <div style="padding: 30px 20px;">
          <p style="color: #333; font-size: 15px; margin-bottom: 25px;">
            Hello <strong>${order.shippingAddress.name}</strong>,<br><br>
            Thank you for shopping with us. We have received your order and are getting it ready for shipment. Below are your order details.
          </p>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 14px;">
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0; color: #666;">Order Number:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #333;">${order.orderNumber}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0; color: #666;">Order Date:</td>
              <td style="padding: 10px 0; text-align: right; color: #333;">${new Date(order.createdAt).toLocaleDateString()}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0; color: #666;">Payment Status:</td>
              <td style="padding: 10px 0; text-align: right; color: #333; text-transform: capitalize;">${order.paymentStatus}</td>
            </tr>
          </table>

          <div style="border: 1px solid #eee; border-radius: 4px; overflow: hidden; margin-bottom: 25px;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead style="background-color: #f8f9fa;">
                <tr>
                  <th style="padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #666; border-bottom: 1px solid #eee;">Item Details</th>
                  <th style="padding: 12px; text-align: right; font-size: 12px; text-transform: uppercase; color: #666; border-bottom: 1px solid #eee;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td style="padding: 15px 12px; border-bottom: 1px solid #eee;">
                      <div style="color: #333; font-weight: bold; font-size: 14px;">${item.name}</div>
                      <div style="color: #777; font-size: 12px; margin-top: 4px;">
                        Qty: ${item.quantity} 
                        ${item.selectedColor ? `| Color: ${item.selectedColor}` : ''}
                        ${item.selectedSize ? `| Size: ${item.selectedSize}` : ''}
                      </div>
                    </td>
                    <td style="padding: 15px 12px; text-align: right; border-bottom: 1px solid #eee; font-size: 14px; color: #333;">
                      ${formatCurrency(item.price * item.quantity)}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <table style="width: 100%; font-size: 14px; margin-bottom: 30px;">
            <tr>
              <td style="padding: 5px 0; color: #666; text-align: right;">Subtotal:</td>
              <td style="padding: 5px 0 5px 20px; text-align: right; width: 100px;">${formatCurrency(order.subtotal || order.totalAmount)}</td>
            </tr>
            ${order.discount > 0 ? `
              <tr>
                <td style="padding: 5px 0; color: #2e7d32; text-align: right;">Discount:</td>
                <td style="padding: 5px 0 5px 20px; text-align: right; color: #2e7d32;">-${formatCurrency(order.discount)}</td>
              </tr>
            ` : ''}
            <tr>
              <td style="padding: 5px 0; color: #666; text-align: right;">Shipping:</td>
              <td style="padding: 5px 0 5px 20px; text-align: right;">${order.shippingCost === 0 ? 'Free' : formatCurrency(order.shippingCost)}</td>
            </tr>
            <tr>
              <td style="padding: 15px 0 5px; color: #333; font-weight: bold; text-align: right; border-top: 1px solid #eee;">Grand Total:</td>
              <td style="padding: 15px 0 5px 20px; text-align: right; font-weight: bold; font-size: 16px; border-top: 1px solid #eee;">${formatCurrency(order.totalAmount)}</td>
            </tr>
          </table>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Shipping Address</h3>
            <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.6;">
              <strong>${order.shippingAddress.name}</strong><br>
              ${order.shippingAddress.address}<br>
              ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}<br>
              Phone: ${order.shippingAddress.phone}
            </p>
          </div>

          <p style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
            Thank you for choosing SareeWeb.
          </p>
        </div>
      </div>
    `
  }),

  orderShipped: (order) => ({
    subject: `Order Shipped - ${order.orderNumber}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; background-color: #ffffff;">
        <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-bottom: 1px solid #eee;">
          <h1 style="color: #333; margin: 0; font-family: serif;">SareeWeb</h1>
        </div>
        
        <div style="padding: 30px;">
          <h2 style="color: #333; font-size: 20px; margin-top: 0;">Your Order is on the way!</h2>
          <p style="color: #555; line-height: 1.6;">
            Dear ${order.shippingAddress.name},<br><br>
            We are pleased to inform you that your order <strong>${order.orderNumber}</strong> has been dispatched from our warehouse.
          </p>
          
          <div style="border: 1px solid #b3e5fc; background-color: #e1f5fe; padding: 15px; border-radius: 4px; margin: 25px 0;">
            <table style="width: 100%;">
              <tr>
                <td style="font-size: 14px; color: #0277bd;"><strong>Status:</strong> Shipped</td>
              </tr>
              <tr>
                <td style="font-size: 14px; color: #0277bd; padding-top: 5px;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</td>
              </tr>
            </table>
          </div>
          
          <h3 style="font-size: 16px; margin-bottom: 10px;">Shipment Details</h3>
          <p style="font-size: 14px; color: #666; line-height: 1.6; margin-top: 0;">
            The package is being handled by our courier partner. You should receive your delivery within the estimated timeline provided at checkout.
          </p>

          <h3 style="font-size: 16px; margin-bottom: 10px; margin-top: 25px;">Shipping To:</h3>
          <p style="font-size: 14px; color: #666; line-height: 1.6; margin-top: 0; background-color: #f9f9f9; padding: 15px; border-radius: 4px;">
            ${order.shippingAddress.name}<br>
            ${order.shippingAddress.address}, ${order.shippingAddress.city}<br>
            ${order.shippingAddress.state}, ${order.shippingAddress.pincode}
          </p>
        </div>
      </div>
    `
  }),

  orderDelivered: (order) => ({
    subject: `Delivered - ${order.orderNumber}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; background-color: #ffffff;">
        <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-bottom: 1px solid #eee;">
          <h1 style="color: #333; margin: 0; font-family: serif;">SareeWeb</h1>
        </div>
        
        <div style="padding: 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #2e7d32; margin: 0 0 10px 0;">Delivered Successfully</h2>
            <p style="color: #666; font-size: 14px; margin: 0;">Your package has arrived.</p>
          </div>

          <p style="color: #333; line-height: 1.6;">
            Hello ${order.shippingAddress.name},<br><br>
            We are writing to confirm that order <strong>${order.orderNumber}</strong> has been delivered to your shipping address.
          </p>
          
          <div style="background-color: #f1f8e9; border-left: 4px solid #558b2f; padding: 15px; margin: 25px 0;">
            <p style="margin: 0; font-size: 14px; color: #33691e;">
              <strong>Delivery Date:</strong> ${new Date().toLocaleDateString()}<br>
              <strong>Location:</strong> ${order.shippingAddress.city}, ${order.shippingAddress.state}
            </p>
          </div>
          
          <p style="color: #333; line-height: 1.6;">
            We hope you love your purchase! Thank you for supporting our traditional saree collection.
          </p>

          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="text-align: center; font-size: 12px; color: #999;">
            If you have any issues with this delivery, please reply to this email.
          </p>
        </div>
      </div>
    `
  })
};

// Send email function
const sendEmail = async (to, template, data) => {
  try {
    const emailData = emailTemplates[template](data);
    
    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || 'SareeWeb',
        address: process.env.EMAIL_USER
      },
      to: to,
      subject: emailData.subject,
      html: emailData.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

// Exported functions (Logic remains unchanged)
const sendOrderConfirmation = async (order) => {
  const customerEmail = order.user?.email || order.customerEmail;
  if (!customerEmail) return { success: false, error: 'Customer email not found' };
  return await sendEmail(customerEmail, 'orderConfirmation', order);
};

const sendOrderShipped = async (order) => {
  const customerEmail = order.user?.email || order.customerEmail;
  if (!customerEmail) return { success: false, error: 'Customer email not found' };
  return await sendEmail(customerEmail, 'orderShipped', order);
};

const sendOrderDelivered = async (order) => {
  const customerEmail = order.user?.email || order.customerEmail;
  if (!customerEmail) return { success: false, error: 'Customer email not found' };
  return await sendEmail(customerEmail, 'orderDelivered', order);
};

const sendPaymentConfirmed = async (order) => {
  const customerEmail = order.user?.email || order.customerEmail;
  if (!customerEmail) return { success: false, error: 'Customer email not found' };
  return await sendEmail(customerEmail, 'paymentConfirmed', order);
};

const sendAdminNotification = async (order) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return { success: false, error: 'Admin email not configured' };
  return await sendEmail(adminEmail, 'adminNotification', order);
};

module.exports = {
  sendEmail,
  sendOrderConfirmation,
  sendPaymentConfirmed,
  sendOrderShipped,
  sendOrderDelivered,
  sendAdminNotification
};