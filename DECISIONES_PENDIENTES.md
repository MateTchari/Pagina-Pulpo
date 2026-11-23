# Decisiones comerciales pendientes

- Nombre y logos confirmados por el usuario: SANTOS, aplicados en tienda y administración. Las fotografías de remeras son mockups provisorios; reemplazar con fotos definitivas cuando estén disponibles. Los colores siguen siendo editables.
- Moneda: elegir durante configuración inicial; el checkout queda bloqueado hasta completar la configuración.
- Pago y entrega: coordinación manual explícita, sin pasarela ni comprobantes de pago. Habilitar pedidos requiere que el administrador acepte este flujo en configuración.
- Datos de comprador: se implementan nombre, email y nota opcional para coordinar. No se solicita domicilio ni información financiera hasta definir entrega y pago.
- Stock: sin reserva previa; confirmación manual atómica descuenta stock. Cancelación reintegra stock incluso si ya estaba en preparación. Un pedido completado es terminal; devoluciones posteriores requieren ajuste auditado.
- Personalización: nota libre de pedido; no hay recargos automáticos ni editor gráfico.
- Impuestos, comisiones, envío y gastos operativos: fuera de los márgenes brutos; no se calcula ganancia neta ni cobros.
- Infraestructura final, dominio, SMTP, copias de seguridad y almacenamiento de imágenes: definir antes de producción. Almacenamiento local requiere disco persistente.
