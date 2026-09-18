import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../../config/config.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(EmailService.name);

  constructor(private config: ConfigService) {
    const host = this.config.get('SMTP_HOST');
    const user = this.config.get('SMTP_USER');
    const pass = this.config.get('SMTP_PASS');
    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(this.config.get('SMTP_PORT') || '587', 10),
        secure: (this.config.get('SMTP_PORT') || '587') === '465',
        auth: { user, pass },
      });
      this.logger.log('Email transporter configured');
    } else {
      this.logger.warn('SMTP not configured — emails will be logged only');
    }
  }

  private get fromAddress(): string {
    return this.config.get('SMTP_FROM') || this.config.get('SMTP_USER') || 'orders@hiddenglow.pk';
  }

  async send(to: string, subject: string, html: string): Promise<boolean> {
    if (!to) return false;
    if (!this.transporter) {
      this.logger.log(`[Email Preview] To: ${to} | Subject: ${subject}`);
      return true;
    }
    try {
      await this.transporter.sendMail({
        from: `"Hidden Glow" <${this.fromAddress}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}: ${subject}`);
      return true;
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${err.message}`);
      return false;
    }
  }

  async sendOrderConfirmation(order: any): Promise<boolean> {
    const items = (order.items || [])
      .map(
        (i: any) =>
          `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${i.productName}${i.size ? ` (${i.size})` : ''}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">Rs. ${Number(i.price * i.quantity).toLocaleString()}</td></tr>`,
      )
      .join('');

    const html = `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
        <div style="background:#2b2b2b;padding:30px 20px;text-align:center;">
          <h1 style="color:#e8a0b4;margin:0;font-size:24px;">Hidden Glow</h1>
        </div>
        <div style="padding:30px 20px;">
          <h2 style="color:#2b2b2b;margin:0 0 10px;">Thank you for your order!</h2>
          <p style="color:#666;margin:0 0 20px;">Hi ${order.customerName}, your order has been received and is being processed.</p>
          <div style="background:#fdf2f4;border-radius:12px;padding:20px;margin-bottom:20px;">
            <p style="margin:0 0 5px;"><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p style="margin:0 0 5px;"><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p style="margin:0;"><strong>Payment:</strong> Cash on Delivery</p>
          </div>
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            <thead><tr style="background:#f9f9f9;"><th style="padding:10px 8px;text-align:left;">Item</th><th style="padding:10px 8px;text-align:center;">Qty</th><th style="padding:10px 8px;text-align:right;">Price</th></tr></thead>
            <tbody>${items}</tbody>
            <tfoot>
              <tr><td colspan="2" style="padding:8px;text-align:right;">Subtotal</td><td style="padding:8px;text-align:right;">Rs. ${Number(order.subtotal).toLocaleString()}</td></tr>
              <tr><td colspan="2" style="padding:8px;text-align:right;">Shipping</td><td style="padding:8px;text-align:right;">${Number(order.shippingFee) === 0 ? 'Free' : 'Rs. ' + Number(order.shippingFee).toLocaleString()}</td></tr>
              <tr style="font-weight:bold;font-size:16px;"><td colspan="2" style="padding:10px 8px;text-align:right;border-top:2px solid #2b2b2b;">Total</td><td style="padding:10px 8px;text-align:right;border-top:2px solid #2b2b2b;">Rs. ${Number(order.total).toLocaleString()}</td></tr>
            </tfoot>
          </table>
          <div style="background:#f9f9f9;border-radius:12px;padding:20px;margin-bottom:20px;">
            <h3 style="margin:0 0 10px;font-size:14px;color:#2b2b2b;">Delivery Details</h3>
            <p style="margin:0 0 5px;color:#666;">${order.customerName}</p>
            <p style="margin:0 0 5px;color:#666;">${order.address}</p>
            <p style="margin:0 0 5px;color:#666;">${order.city}</p>
            <p style="margin:0;color:#666;">${order.phone}</p>
          </div>
          <p style="color:#666;font-size:13px;">You can track your order at <a href="https://hiddenglow.pk/track-order" style="color:#e8a0b4;">hiddenglow.pk/track-order</a> using your order number.</p>
        </div>
        <div style="background:#2b2b2b;padding:20px;text-align:center;">
          <p style="color:#999;margin:0;font-size:12px;">&copy; ${new Date().getFullYear()} Hidden Glow. Private packaging on every order.</p>
        </div>
      </div>`;

    return this.send(order.email, `Order Confirmed - ${order.orderNumber}`, html);
  }

  async sendOrderStatusUpdate(order: any, note?: string): Promise<boolean> {
    const statusText: Record<string, string> = {
      confirmed: 'Your order has been confirmed and is being prepared.',
      shipped: 'Your order has been shipped! It\'s on its way to you.',
      delivered: 'Your order has been delivered. We hope you love it!',
      cancelled: 'Your order has been cancelled.',
    };

    const trackingInfo =
      order.status === 'shipped' && order.trackingNumber
        ? `<div style="background:#f0f0ff;border-radius:12px;padding:20px;margin:15px 0;">
            <h3 style="margin:0 0 10px;font-size:14px;">Tracking Information</h3>
            <p style="margin:0 0 5px;"><strong>Courier:</strong> ${order.courierName || 'Standard Delivery'}</p>
            <p style="margin:0;"><strong>Tracking #:</strong> ${order.trackingNumber}</p>
           </div>`
        : '';

    const html = `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
        <div style="background:#2b2b2b;padding:30px 20px;text-align:center;">
          <h1 style="color:#e8a0b4;margin:0;font-size:24px;">Hidden Glow</h1>
        </div>
        <div style="padding:30px 20px;">
          <h2 style="color:#2b2b2b;margin:0 0 10px;">Order ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</h2>
          <p style="color:#666;margin:0 0 20px;">Hi ${order.customerName}, ${statusText[order.status] || 'Your order status has been updated.'}</p>
          <div style="background:#fdf2f4;border-radius:12px;padding:20px;margin-bottom:20px;">
            <p style="margin:0 0 5px;"><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p style="margin:0;"><strong>Status:</strong> ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</p>
          </div>
          ${trackingInfo}
          ${note ? `<p style="color:#666;margin:15px 0;padding:15px;background:#fffbe6;border-radius:8px;"><strong>Note:</strong> ${note}</p>` : ''}
          <p style="color:#666;font-size:13px;">Track your order at <a href="https://hiddenglow.pk/track-order" style="color:#e8a0b4;">hiddenglow.pk/track-order</a></p>
        </div>
        <div style="background:#2b2b2b;padding:20px;text-align:center;">
          <p style="color:#999;margin:0;font-size:12px;">&copy; ${new Date().getFullYear()} Hidden Glow. Private packaging on every order.</p>
        </div>
      </div>`;

    return this.send(order.email, `Order ${order.status.charAt(0).toUpperCase() + order.status.slice(1)} - ${order.orderNumber}`, html);
  }
}
