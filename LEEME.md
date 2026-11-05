# Nuestro mapa ♥

Un globo interactivo con vuestros viajes. Los países visitados se iluminan, al tocarlos salen sus ciudades y cada ciudad abre su álbum de polaroids.

## Cómo añadir fotos y ciudades

Todo se hace con carpetas dentro de `viajes/`. La estructura es siempre:

```
viajes/
  Italia/            ← el país
    Bolonia/         ← la ciudad
      foto1.jpg
      foto2.jpg
      notas.txt      ← opcional
```

1. Crea la carpeta del país (en español o en inglés: `España`, `Italy`, `Japón`…).
2. Dentro, crea una carpeta con el nombre de la ciudad.
3. Mete las fotos dentro (jpg, png o webp). Salen ordenadas por nombre de archivo, así que puedes poner `01-playa.jpg`, `02-cena.jpg`… para controlar el orden.
4. Ejecuta en una terminal, dentro de esta carpeta:

   ```
   python3 generar.py
   ```

5. Abre `index.html` en el navegador.

La primera vez que aparece una ciudad nueva, el script busca sus coordenadas por internet y las guarda en un archivo `ciudad.json` dentro de su carpeta. Si no la encuentra, abre ese archivo y escribe a mano:

```json
{ "nombre": "Bolonia", "lat": 44.4949, "lon": 11.3426 }
```

### Notas bajo las fotos (opcional)

Crea un archivo `notas.txt` en la carpeta de la ciudad, una línea por foto:

```
01-playa.jpg: El mejor atardecer del viaje
02-cena.jpg: Aquella pasta ♥
```

### Para que vaya rápido

Instala Pillow una vez para que las fotos se reduzcan solas (tus originales no se tocan):

```
pip install pillow
```

## Qué hay en cada carpeta

| Carpeta | Para qué sirve |
|---|---|
| `viajes/` | **Aquí metes tú las fotos y ciudades.** |
| `fotos/` | Copias optimizadas que genera el script. No la toques. |
| `data/` | Datos del mapa y de tus viajes (los genera el script). |
| `css/`, `js/` | El diseño y el funcionamiento de la web. |
| `lib/` | Librerías incluidas, para que funcione sin descargar nada. |

## Ponerlo en internet (para la pegatina NFC)

Para que cualquiera lo vea al escanear necesitas alojarlo. Lo más fácil y gratis es **Netlify Drop** (app.netlify.com/drop), **Cloudflare Pages** o **GitHub Pages**. Sube la carpeta entera **menos `viajes/`** (son tus originales y pesan mucho). Te darán un enlace: ese es el que grabas en la pegatina con NFC Tools.

Cuando añadas viajes nuevos, repite el paso de `python3 generar.py` y vuelve a subir la carpeta con el mismo enlace.
