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

// Email templates
const emailTemplates = {
  adminNotification: (order) => ({
    subject: `New Order Received - ${order.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">New Order Received</h2>
        <p><strong>Order Number:</strong> ${order.orderNumber}</p>
        <p><strong>Customer:</strong> ${order.shippingAddress?.name || 'N/A'}</p>
        <p><strong>Email:</strong> ${order.user?.email || order.customerEmail || 'N/A'}</p>
        <p><strong>Phone:</strong> ${order.shippingAddress?.phone || order.customerPhone || 'N/A'}</p>
        <p><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
        <p><strong>Payment Method:</strong> ${(order.paymentMethod || '').toUpperCase()}</p>
        <p><strong>Status:</strong> ${order.status}</p>

        <h3>Items</h3>
        <ul>
          ${(order.items || []).map(i => `<li>${i.name} × ${i.quantity} (₹${i.price})</li>`).join('')}
        </ul>

        ${order.shippingAddress ? `
          <h3>Shipping Address</h3>
          <p>
            ${order.shippingAddress.address}<br>
            ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}
          </p>
        ` : ''}
      </div>
    `
  }),

  paymentConfirmed: (order) => ({
    subject: `Payment Confirmed - ${order.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h1 style="color: #333; margin: 0;">SareeWeb</h1>
          <p style="color: #666; margin: 5px 0 0 0;">Traditional Indian Sarees</p>
        </div>

        <div style="padding: 20px;">
          <h2 style="color: #333;">Payment Confirmed</h2>
          <p>Dear ${order.shippingAddress?.name || 'Customer'},</p>
          <p>We have successfully received your payment for order <strong>${order.orderNumber}</strong>.</p>

          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Amount Paid:</strong> ₹${order.totalAmount}</p>
            <p style="margin: 5px 0 0 0;"><strong>Payment Method:</strong> ${(order.paymentMethod || '').toUpperCase()}</p>
          </div>

          <p>We will start processing your order and will notify you when it ships.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/orders/${order._id}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Your Order</a>
          </div>
        </div>
      </div>
    `
  }),

  orderConfirmation: (order) => ({
    subject: `Order Confirmation - ${order.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h1 style="color: #333; margin: 0;">SareeWeb</h1>
          <p style="color: #666; margin: 5px 0 0 0;">Traditional Indian Sarees</p>
        </div>
        
        <div style="padding: 20px;">
          <h2 style="color: #333;">Order Confirmation</h2>
          <p>Dear ${order.shippingAddress.name},</p>
          <p>Thank you for your order! We have received your order and will process it shortly.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0;">Order Details</h3>
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
            <p><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</p>
            <p><strong>Status:</strong> ${order.status}</p>
          </div>
          
          <h3 style="color: #333;">Items Ordered</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Item</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Qty</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 8px;">
                    ${item.name}<br>
                    <small style="color: #666;">
                      ${item.selectedColor ? `Color: ${item.selectedColor}` : ''}
                      ${item.selectedSize ? ` | Size: ${item.selectedSize}` : ''}
                    </small>
                  </td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.quantity}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${item.price}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="text-align: right; margin: 20px 0;">
            <p><strong>Subtotal:</strong> ₹${order.subtotal}</p>
            ${order.discount > 0 ? `<p><strong>Discount:</strong> -₹${order.discount}</p>` : ''}
            <p><strong>Shipping:</strong> ₹${order.shippingCost}</p>
            ${order.tax > 0 ? `<p><strong>Tax:</strong> ₹${order.tax}</p>` : ''}
            <p style="font-size: 18px; font-weight: bold;"><strong>Total:</strong> ₹${order.totalAmount}</p>
          </div>
          
          <h3 style="color: #333;">Shipping Address</h3>
          <div style="background-color: #f8f9fa; padding: 15px;">
            <p style="margin: 0;"><strong>${order.shippingAddress.name}</strong></p>
            <p style="margin: 5px 0;">${order.shippingAddress.address}</p>
            <p style="margin: 5px 0;">${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}</p>
            <p style="margin: 5px 0;"><strong>Phone:</strong> ${order.shippingAddress.phone}</p>
          </div>
          
          <div style="margin-top: 30px; padding: 20px; background-color: #e9ecef; text-align: center;">
            <p style="margin: 0; color: #666;">We'll send you shipping updates as your order progresses.</p>
            <p style="margin: 5px 0 0 0; color: #666;">If you have any questions, contact us at support@sareeweb.com</p>
          </div>
        </div>
      </div>
    `
  }),

  orderShipped: (order) => ({
    subject: `Order Shipped - ${order.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h1 style="color: #333; margin: 0;">SareeWeb</h1>
          <p style="color: #666; margin: 5px 0 0 0;">Traditional Indian Sarees</p>
        </div>
        
        <div style="padding: 20px;">
          <h2 style="color: #333;">Your Order Has Been Shipped!</h2>
          <p>Dear ${order.shippingAddress.name},</p>
          <p>Great news! Your order ${order.orderNumber} has been shipped and is on its way to you.</p>
          
          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #155724;">Order Status: Shipped</h3>
            <p style="margin: 5px 0;"><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p style="margin: 5px 0;"><strong>Shipped Date:</strong> ${new Date().toLocaleDateString()}</p>
            ${order.estimatedDelivery ? `<p style="margin: 5px 0;"><strong>Expected Delivery:</strong> ${new Date(order.estimatedDelivery).toLocaleDateString()}</p>` : ''}
          </div>
          
          <p>Your order is being delivered by our shipping partner. You can expect to receive it within 3-5 business days.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/orders/${order._id}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Track Your Order</a>
          </div>
          
          <p>Thank you for choosing SareeWeb for your traditional saree needs!</p>
        </div>
      </div>
    `
  }),

  orderDelivered: (order) => ({
    subject: `Order Delivered - ${order.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h1 style="color: #333; margin: 0;">SareeWeb</h1>
          <p style="color: #666; margin: 5px 0 0 0;">Traditional Indian Sarees</p>
        </div>
        
        <div style="padding: 20px;">
          <h2 style="color: #333;">Your Order Has Been Delivered!</h2>
          <p>Dear ${order.shippingAddress.name},</p>
          <p>We're delighted to confirm that your order ${order.orderNumber} has been successfully delivered.</p>
          
          <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #0c5460;">Order Status: Delivered</h3>
            <p style="margin: 5px 0;"><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p style="margin: 5px 0;"><strong>Delivered Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          <p>We hope you're enjoying your beautiful saree! We'd love to hear your feedback.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/orders/${order._id}/review" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Write a Review</a>
          </div>
          
          <p>Thank you for choosing SareeWeb. We look forward to serving you again!</p>
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

// Send order confirmation email
const sendOrderConfirmation = async (order) => {
  const customerEmail = order.user?.email || order.customerEmail;
  if (!customerEmail) {
    console.error('Customer email not found for order:', order.orderNumber);
    return { success: false, error: 'Customer email not found' };
  }

  return await sendEmail(customerEmail, 'orderConfirmation', order);
};

// Send order shipped email
const sendOrderShipped = async (order) => {
  const customerEmail = order.user?.email || order.customerEmail;
  if (!customerEmail) {
    console.error('Customer email not found for order:', order.orderNumber);
    return { success: false, error: 'Customer email not found' };
  }

  return await sendEmail(customerEmail, 'orderShipped', order);
};

// Send order delivered email
const sendOrderDelivered = async (order) => {
  const customerEmail = order.user?.email || order.customerEmail;
  if (!customerEmail) {
    console.error('Customer email not found for order:', order.orderNumber);
    return { success: false, error: 'Customer email not found' };
  }

  return await sendEmail(customerEmail, 'orderDelivered', order);
};

// Send payment confirmation email
const sendPaymentConfirmed = async (order) => {
  const customerEmail = order.user?.email || order.customerEmail;
  if (!customerEmail) {
    console.error('Customer email not found for order:', order.orderNumber);
    return { success: false, error: 'Customer email not found' };
  }

  return await sendEmail(customerEmail, 'paymentConfirmed', order);
};

// Send admin notification
const sendAdminNotification = async (order) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.error('Admin email not configured');
    return { success: false, error: 'Admin email not configured' };
  }

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