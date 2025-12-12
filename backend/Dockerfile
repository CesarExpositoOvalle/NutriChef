# Usar una imagen base oficial de PHP con Apache
FROM php:8.0-apache

# Instalar las extensiones necesarias, incluida mysqli
RUN docker-php-ext-install mysqli

# Habilitar la extensión mysqli
RUN docker-php-ext-enable mysqli

# Copiar los archivos de tu aplicación al contenedor
COPY ./ /var/www/html/
