<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest



## Davivienda Fan Shop API

1. Clonar proyecto 
    ``` 
    git clone https://github.com/24BytesCo/davivienda-fan-shop-api.git 
    ```
2. Navega hacia el proyecto
    ``` 
    cd davivienda-fan-shop-api 
    ```
3. Instalar dependencias
    ```
    yarn install
    ```

4. Modificar el nombre del archivo .env.template a .env
5. Cambiar las variables de entorno
6. Levantar la base de datos
    ```
    docker-compose up -d
    ```
7. Levantar el proyecto con: 
    ```
    yarn start:dev
    ```