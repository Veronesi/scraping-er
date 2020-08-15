const fs = require('fs')
const db = ['ubicaciones', 'servicios', 'actividad', 'destinos', 'itinerarios']
const regexr = {
    ubicaciones: /\((?<id>\d+)\,\s(?<tipo>\d+)\,\s\'(?<nombre>.{1,40})\'\,\s(?<pertenece>\d+)\,\s(?<turistico>\d+)\,\s\'(?<url>(?:\w+|\-)*)\'\)/,
    servicios: /\((?<id>\d+)\,\s(?<tipo>\d+)\,\s\'(?<nombre>.{1,30})\'\,\s(?<categoria>\d+),\s(?<ubicacionId>\d+)\,\s\'(?<direccion>.{0,30})\',\s\'(?<direccionNro>.{0,30})\'\,\s\'(?<codigoPostal>\d+)\'\,\s\'(?<telPref1>\d+)?\'\,\s\'(?<tel1>\d+)?\'\,\s\'(?<telPref2>\d+)?\'\,\s\'(?<tel2>\d+)?\'\,\s\'(?<telPref3>\d+)?\'\,\s\'(?<tel3>\d+)?\'\,\s\'(?<telPref4>\d+)?\'\,\s\'(?<tel4>\d+)?\'\,\s\'(?<telPref5>\d+)?\'\,\s\'(?<tel5>\d+)?\'\,\s\'(?<email1>.{0,20}\@\w+\.\w+)?\'\,\s\'(?<email2>.{0,20}\@\w+\.\w+)?\'\,\s\'(?<email3>.{0,20}\@\w+\.\w+)?\'\,\s\'(?<servicioWeb>.{0,30})?\'\,\s(?<mapaX>(?:(?:\-|.)\d+(?:\-|.)\d+)|0)\,\s(?<mapaY>(?:(?:\-|.)\d+(?:\-|.)\d+)|0)\,\s\'(?<descripcion>.{0,200})\'\,\s\'(?<servicios>.{0,50})?\'\,\s(?<estado>\d+)\,\s\'(?<pageUrl>.{0,50})\'\,\s\'(?<campo1>.{0,20})\',\s\'(?<campo2>.{0,20})\',\s\'(?<campo3>.{0,20})\',\s\'(?<campo4>.{0,20})\',\s\'(?<campo5>.{0,20})\'\)/,
    noticias: /\((?<id>\d+),\s\'(?<volanta>.*)\',\s\'(?<titulo>.*)\'\,\s\'(?<bajada>.*)\'\,\s\'(?<texto>(?:.|\n|\r)*)\'\,\s(?<fecha_hora>\d+),\s(?<fecha_hora_actualizacion>\d+),\s(?<fecha_evento>\d+),\s(?<seccion_id>\d+),\s(?<comentada>\d+),\s(?<usuario_id>\d+),\s(?<estado>\d+),\s(?<producto_id>\d+),\s(?<ubicacion_id>\d+),\s(?<origen>\d+),\s\'(?<page_url>.*)\'\)/,
    noticias_imagenes: /\((?<id>\d+),\s(?<noticiaId>\d+),\s(?<imgId>\d+),\s\'.{0,80}\'\,\s(?<orden>\d+)\)/,
    galeria_imagenes: /\((?<img_id>\d+),\s\'(?<img_file>\d+\.jpg)\'\,\s\'(.{0,80})\',\s(?<img_fecha>\d+),\s\d+,\s\d+,\s\d+,\s\d+\,\s\'\'\)/,
}

let data, lines, noticias, ubicaciones, listaImagen, ubicacionesNew, galeriaIamges, noticiaIamges;

if (db.includes(process.argv[2])) {

    switch (process.argv[2]) {
        case 'ubicaciones':
            data = fs.readFileSync(`db/${process.argv[2]}.sql`, 'UTF-8');
            lines = data.split(/\n/);

            ubicaciones = [];

            lines.forEach(line => {
                let match = regexr[process.argv[2]].exec(line)
                match ? ubicaciones.push({
                    id: match.groups.id,
                    tipo: match.groups.tipo,
                    nombre: match.groups.nombre,
                    pertenece: match.groups.pertenece
                }) : false;
            })


            let provincias = {}

            ubicaciones.filter(e => e.tipo == 2).forEach((provincia, indexProvincia) => {
                let ciudades = {};

                let indexCiudad = 0;
                let indexLocalidad = 0;

                ubicaciones.filter(e => e.pertenece == provincia.id).forEach(ciudad => {
                    let localidades = {};

                    ubicaciones.filter(e => e.pertenece == ciudad.id).forEach(localidad => {
                        indexLocalidad++;
                        localidades[localidad.nombre] = {
                            id: indexLocalidad
                        }
                    })
                    indexCiudad++;
                    ciudades[ciudad.nombre] = {
                        id: indexCiudad,
                        localidad: localidades
                    }
                })
                provincias[provincia.nombre] = {
                    id: indexProvincia,
                    ciudad: ciudades
                }
            })

            /* Ciudades y localidades de Entre Rios */
            let ciudadesER = ubicaciones.filter(e => e.pertenece == 7)
            ciudadesER = ciudadesER.map((ciudad, indexCiudad) => {
                return {
                    id: indexCiudad + 1,
                    oldId: ciudad.id,
                    nombre: ciudad.nombre
                }
            })

            let idLocalidad = 0;
            let localidadesER = [];
            ciudadesER.forEach(ciudad => {
                let localidades = ubicaciones.filter(localidad => localidad.pertenece == ciudad.oldId);
                localidadesER.push(...localidades.map(localidad => {
                    idLocalidad++;
                    return {
                        id: idLocalidad,
                        id_ciudad: ciudad.id,
                        nombre: localidad.nombre,
                        oldId: localidad.id
                    }
                }))
            })

            ciudadesER = ciudadesER.map(ciudad => {
                return {
                    id: ciudad.id,
                    oldId: ciudad.oldId,
                    nombre: ciudad.nombre
                }
            })

            fs.writeFileSync('export/Provincia.json', JSON.stringify(provincias))
            fs.writeFileSync('export/entreRios/Ciudad.json', JSON.stringify(ciudadesER))
            fs.writeFileSync('export/entreRios/Localidad.json', JSON.stringify(localidadesER))
            break;

        case 'servicios':
            data = fs.readFileSync(`db/${process.argv[2]}.sql`, 'UTF-8');
            lines = data.split(/\n/);

            break;
        case 'itinerarios':
            data = fs.readFileSync(`db/noticias.sql`, 'UTF-8');
            lines = data.split(/\n/);

            noticias = [];

            ubicacionesNew = JSON.parse(fs.readFileSync(`export/entreRios/Localidad.json`, 'UTF-8'));

            // ------------ Galeria imagenes -------------
            dataGaleriaImage = fs.readFileSync(`db/galeria_imagenes.sql`, 'UTF-8');
            linesGaleriaImage = dataGaleriaImage.split(/\n/);

            galeriaIamges = []

            linesGaleriaImage.forEach(line => {
                let match = regexr.galeria_imagenes.exec(line)
                match ? galeriaIamges.push(match.groups) : false;
            })
            /////////////////////////////////////////////

            // ------------ Noticias imagenes ------------
            dataNoticiaImage = fs.readFileSync(`db/noticias_imagenes.sql`, 'UTF-8');
            linesNoticiaImage = dataNoticiaImage.split(/\n/);

            noticiaIamges = []

            linesNoticiaImage.forEach(line => {
                let match = regexr.noticias_imagenes.exec(line)
                match ? noticiaIamges.push(match.groups) : false;
            })
            /////////////////////////////////////////////

            lines.forEach(line => {
                let match = regexr['noticias'].exec(line)
                match && match.groups.seccion_id == '15' ? noticias.push(match.groups) : false;
            })

            noticias = noticias.map((noticia, index) => {


                // ---------- Set images -------------
                listaImagen = [];

                listaImagen = noticiaIamges.filter(noticia_imagen =>
                    noticia_imagen.noticiaId == noticia.id
                ).map(noticia_imagen => {
                    let image = galeriaIamges.find(e =>
                        e.img_id == noticia_imagen.imgId
                    )

                    return {
                        img_file: image.img_file,
                        img_fecha: image.img_fecha + '000',
                        orden: noticia_imagen.orden
                    }
                })

                let idLocalidad = ubicacionesNew.find(e => e.oldId == noticia.ubicacion_id)
                return {
                    id: index + 1,
                    id_localidad: idLocalidad ? idLocalidad.id : -1,
                    nombre: noticia.titulo,
                    descripcion: noticia.bajada,
                    detalles: noticia.texto,
                    direccion: '',
                    telefono: '',
                    web: '',
                    email: '',
                    activo: 0,
                    lista_imagen: listaImagen
                }
            });
            fs.writeFileSync('export/Itinerario.json', JSON.stringify(noticias))
            break;
        case 'actividad':
            data = fs.readFileSync(`db/noticias.sql`, 'UTF-8');
            lines = data.split(/\n/);


            // ------------ Galeria imagenes -------------
            dataGaleriaImage = fs.readFileSync(`db/galeria_imagenes.sql`, 'UTF-8');
            linesGaleriaImage = dataGaleriaImage.split(/\n/);

            galeriaIamges = []

            linesGaleriaImage.forEach(line => {
                let match = regexr.galeria_imagenes.exec(line)
                match ? galeriaIamges.push(match.groups) : false;
            })
            /////////////////////////////////////////////


            // ------------ Noticias imagenes ------------
            dataNoticiaImage = fs.readFileSync(`db/noticias_imagenes.sql`, 'UTF-8');
            linesNoticiaImage = dataNoticiaImage.split(/\n/);

            noticiaIamges = []

            linesNoticiaImage.forEach(line => {
                let match = regexr.noticias_imagenes.exec(line)
                match ? noticiaIamges.push(match.groups) : false;
            })
            /////////////////////////////////////////////



            noticias = [];

            lines.forEach(line => {
                let match = regexr['noticias'].exec(line)
                match && match.groups.seccion_id == '4' ? noticias.push(match.groups) : false;
            })
            ubicacionesNew = JSON.parse(fs.readFileSync(`export/entreRios/Localidad.json`, 'UTF-8'));
            noticias = noticias.map((noticia, index) => {


                // ---------- Set images -------------
                listaImagen = [];

                listaImagen = noticiaIamges.filter(noticia_imagen =>
                    noticia_imagen.noticiaId == noticia.id
                ).map(noticia_imagen => {
                    let image = galeriaIamges.find(e =>
                        e.img_id == noticia_imagen.imgId
                    )

                    return {
                        img_file: image.img_file,
                        img_fecha: image.img_fecha + '000',
                        orden: noticia_imagen.orden
                    }
                })
                /////////////////////////////////////////////

                // ---------- Categoria Noticia -------------
                let tipo = -1;
                let subtipo = -1;
                switch (noticia.producto_id) {
                    case '1':
                        tipo = 12
                        break;
                    case '2':
                        tipo = 1
                        subtipo = 1
                        break;
                    case '3':
                        tipo = 9
                        break;
                    case '4':
                        tipo = 11
                        break;
                    case '5':
                        tipo = 3
                        subtipo = 13
                        break;
                    case '6':
                        tipo = 4
                        subtipo = 15
                        break;
                    case '7':
                        tipo = 5
                        subtipo = 18
                        break;
                    case '8':
                        tipo = 6
                        break;
                    case '9':
                        tipo = 14
                        break;
                    case '10':
                        tipo = 18
                        break;
                }
                /////////////////////////////////////////////
                let idLocalidad = ubicacionesNew.find(e => e.oldId == noticia.ubicacion_id)
                return {
                    id: index + 1,
                    id_localidad: idLocalidad ? idLocalidad.id : -1,
                    id_subtipo_actividad: subtipo,
                    id_actividad: tipo,
                    nombre: noticia.titulo,
                    descripcion: noticia.bajada,
                    detalles: noticia.texto,
                    direccion: '',
                    telefono: '',
                    web: '',
                    email: '',
                    activo: 0,
                    lista_imagen: listaImagen
                }
            })
            fs.writeFileSync('export/Actividad.json', JSON.stringify(noticias))
            break;
        case 'destinos':
            data = fs.readFileSync(`db/noticias.sql`, 'UTF-8');
            lines = data.split(/\n/);

            // ------------ Galeria imagenes -------------
            dataGaleriaImage = fs.readFileSync(`db/galeria_imagenes.sql`, 'UTF-8');
            linesGaleriaImage = dataGaleriaImage.split(/\n/);

            galeriaIamges = []

            linesGaleriaImage.forEach(line => {
                let match = regexr.galeria_imagenes.exec(line)
                match ? galeriaIamges.push(match.groups) : false;
            })
            /////////////////////////////////////////////


            // ------------ Noticias imagenes ------------
            dataNoticiaImage = fs.readFileSync(`db/noticias_imagenes.sql`, 'UTF-8');
            linesNoticiaImage = dataNoticiaImage.split(/\n/);

            noticiaIamges = []

            linesNoticiaImage.forEach(line => {
                let match = regexr.noticias_imagenes.exec(line)
                match ? noticiaIamges.push(match.groups) : false;
            })
            /////////////////////////////////////////////

            noticias = [];


            ubicacionesNew = JSON.parse(fs.readFileSync(`export/entreRios/Localidad.json`, 'UTF-8'));
            let ciudadNew = JSON.parse(fs.readFileSync(`export/entreRios/Ciudad.json`, 'UTF-8'));
            lines.forEach((line, index) => {
                let match = regexr['noticias'].exec(line)
                match && match.groups.seccion_id == '7' ? noticias.push({
                    old_id: match.groups.id,
                    id: index + 1,
                    ubicacion_id: match.groups.ubicacion_id,
                    descripcion: match.groups.bajada,
                    detalles: match.groups.texto,
                    direccion: '',
                    telefono: '',
                    web: '',
                    email: '',
                    activo: 0
                }) : false;
            })

            noticias = noticias.map(noticia => {
                let localidad = ubicacionesNew.find(e => e.oldId == noticia.ubicacion_id)
                localidadType = localidad ? 'localidad' : 'ciudad';
                localidad = localidad ? localidad : ciudadNew.find(e => e.oldId == noticia.ubicacion_id)

                // ---------- Set images -------------
                listaImagen = [];

                listaImagen = noticiaIamges.filter(noticia_imagen =>
                    noticia_imagen.noticiaId == noticia.old_id
                ).map(noticia_imagen => {
                    let image = galeriaIamges.find(e =>
                        e.img_id == noticia_imagen.imgId
                    )

                    return {
                        img_file: image.img_file,
                        img_fecha: image.img_fecha + '000',
                        orden: noticia_imagen.orden
                    }
                })
                /////////////////////////////////////////////

                return {
                    id: noticia.id,
                    ubicacion_id: localidad.id,
                    nombre: localidad.nombre,
                    type: localidadType,
                    descripcion: noticia.descripcion,
                    detalles: noticia.detalles,
                    direccion: '',
                    telefono: '',
                    web: '',
                    email: '',
                    activo: 0,
                    lista_imagen: listaImagen
                }
            })
            fs.writeFileSync('export/Destino.json', JSON.stringify(noticias))

            break;
    }

}