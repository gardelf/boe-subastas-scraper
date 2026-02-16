import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import logger from './logger.js';

dotenv.config();

export async function sendEmailNotification(scraperResult) {
  if (process.env.EMAIL_NOTIFICATIONS !== 'true') {
    logger.debug('Notificaciones por email deshabilitadas');
    return;
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, NOTIFY_EMAIL } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !NOTIFY_EMAIL) {
    logger.warn('Configuración de email incompleta, saltando notificación');
    return;
  }

  try {
    // Crear transporter
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT || '587'),
      secure: SMTP_SECURE === 'true',
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });

    // Construir contenido del email
    const { stats, subastas } = scraperResult;
    
    let htmlContent = `
      <h2>🔔 Nuevas Subastas BOE - Rivas Vaciamadrid</h2>
      <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
      <p><strong>Total encontrado:</strong> ${stats.totalFound}</p>
      <p><strong>Nuevas subastas:</strong> ${stats.newItems}</p>
      <hr>
    `;

    if (subastas && subastas.length > 0) {
      htmlContent += '<h3>Detalles de las nuevas subastas:</h3>';
      
      subastas.forEach((subasta, index) => {
        htmlContent += `
          <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px;">
            <h4>${index + 1}. ${subasta.id_subasta}</h4>
            <p><strong>Tipo:</strong> ${subasta.tipo || 'N/A'}</p>
            <p><strong>Estado:</strong> ${subasta.estado || 'N/A'}</p>
            <p><strong>Organismo:</strong> ${subasta.organismo || 'N/A'}</p>
            <p><strong>Descripción:</strong> ${subasta.descripcion_breve || 'N/A'}</p>
            ${subasta.valor_subasta ? `<p><strong>Valor subasta:</strong> ${subasta.valor_subasta.toLocaleString('es-ES')} €</p>` : ''}
            ${subasta.fecha_conclusion ? `<p><strong>Fecha conclusión:</strong> ${subasta.fecha_conclusion}</p>` : ''}
            ${subasta.bien?.direccion ? `<p><strong>Dirección:</strong> ${subasta.bien.direccion}, ${subasta.bien.localidad}</p>` : ''}
            ${subasta.url_detalle ? `<p><a href="${subasta.url_detalle}" target="_blank">Ver detalles completos</a></p>` : ''}
          </div>
        `;
      });
    }

    htmlContent += `
      <hr>
      <p style="color: #666; font-size: 12px;">
        Este es un mensaje automático del scraper de subastas BOE.<br>
        No responder a este email.
      </p>
    `;

    // Enviar email
    const info = await transporter.sendMail({
      from: `"BOE Subastas Scraper" <${SMTP_USER}>`,
      to: NOTIFY_EMAIL,
      subject: `🔔 ${stats.newItems} nueva(s) subasta(s) en Rivas Vaciamadrid`,
      html: htmlContent
    });

    logger.info(`Email enviado: ${info.messageId}`);
    return info;

  } catch (error) {
    logger.error(`Error enviando email: ${error.message}`);
    throw error;
  }
}
