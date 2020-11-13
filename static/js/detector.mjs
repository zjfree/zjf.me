const options = {
	face: {
		fastMode: true,
		maxDetectedFaces: 1
	},
	barcode: {
	formats: [
    'aztec',
    'code_128',
    'code_39',
    'code_93',
    'codabar',
    'data_matrix',
    'ean_13',
    'ean_8',
    'itf',
    'pdf417',
    'qr_code',
    'upc_a',
    'upc_e'
  ]},
	text: {}
}
async function detectShape( image, type ) {
	const bitmap = await createImageBitmap( image );
	const detector = new window[ getDetectorName( type ) ]( options[ type ] );
	const detected = await detector.detect( bitmap );

	return detected;
}

function getDetectorName( type ) {
	return `${ type[ 0 ].toUpperCase() }${ type.substring( 1 ) }Detector`;
}

export default detectShape;
