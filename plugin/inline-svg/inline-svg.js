/**
 * Convert IMG elements with the data-inline-svg attribute into inline SVG
 * elements (which pulls them into the DOM), so that fragments can be applied
 * to individual elements of the SVG image. (You can't do this if the SVG is
 * loaded offline via an IMG element.)
 */
var inlineSVGs = function()
{
	// Shim to add classList property to SVGElement, adapted from
	// http://purl.eligrey.com/github/classList.js/blob/master/classList.js
	// SVGElement in Safari currently doesn't implement the classList property.
	// Other browsers may be similar (Chrome and Firefox appear to be OK).
	if ( !( 'classList' in document.createElementNS( 'http://www.w3.org/2000/svg', 'svg' ) ) )
	{
		(function ( view )
		{
			
			"use strict";
			
			if ( !( 'SVGElement' in view ) ) return;
			
			var	classListProp = "classList",
				protoProp = "prototype",
				elemCtrProto = ( view.SVGElement )[protoProp],
				objCtr = Object,
				strTrim = String[protoProp].trim || function ()
				{
					return this.replace( /^\s+|\s+$/g, "" );
				},
				arrIndexOf = Array[protoProp].indexOf || function ( item )
				{
					for ( var i = 0, len = this.length; i < len; i++ )
					{
						if ( ( i in this ) && ( this[i] === item ) )
						{
							return i;
						}
					}
					return -1;
				},
				// Vendors: please allow content code to instantiate DOMExceptions
				DOMEx = function ( type, message )
				{
					this.name = type;
					this.code = DOMException[type];
					this.message = message;
				},
				checkTokenAndGetIndex = function ( classList, token )
				{
					if ( token === "" )
					{
						throw new DOMEx( "SYNTAX_ERR", "An invalid or illegal string was specified" );
					}
					if (/\s/.test(token))
					{
						throw new DOMEx( "INVALID_CHARACTER_ERR", "String contains an invalid character" );
					}
					return arrIndexOf.call( classList, token );
				},
				ClassList = function ( elem )
				{
					var	trimmedClasses = strTrim.call( elem.className.baseVal ),
						classes = trimmedClasses ? trimmedClasses.split( /\s+/ ) : [];
					for ( var i = 0, len = classes.length; i < len; i++ )
					{
						this.push( classes[i] );
					}
					this._updateClassName = function ()
					{
						elem.className.baseVal = this.toString();
					};
				},
				classListProto = ClassList[protoProp] = [],
				classListGetter = function ()
				{
					return new ClassList( this );
				};
			// Most DOMException implementations don't allow calling DOMException's toString()
			// on non-DOMExceptions. Error's toString() is sufficient here.
			DOMEx[protoProp] = Error[protoProp];
			classListProto.item = function ( i )
			{
				return this[i] || null;
			};
			classListProto.contains = function ( token )
			{
				token += "";
				return checkTokenAndGetIndex( this, token ) !== -1;
			};
			classListProto.add = function ()
			{
				var	tokens = arguments,
					i = 0,
					l = tokens.length,
					token,
					updated = false;
				do
				{
					token = tokens[i] + "";
					if ( checkTokenAndGetIndex( this, token ) === -1 )
					{
						this.push( token );
						updated = true;
					}
				}
				while ( ++i < l );
			
				if ( updated )
				{
					this._updateClassName();
				}
			};
			classListProto.remove = function ()
			{
				var	tokens = arguments,
					i = 0,
					l = tokens.length,
					token,
					updated = false;
				do
				{
					token = tokens[i] + "";
					var index = checkTokenAndGetIndex( this, token );
					if ( index !== -1 )
					{
						this.splice( index, 1 );
						updated = true;
					}
				}
				while ( ++i < l );
			
				if ( updated )
				{
					this._updateClassName();
				}
			};
			classListProto.toggle = function ( token, force )
			{
				token += "";
			
				var	result = this.contains(token),
					method = result ? force !== true && "remove" : force !== false && "add" ;
			
				if ( method )
				{
					this[method]( token );
				}
			
				return !result;
			};
			classListProto.toString = function ()
			{
				return this.join( " " );
			};
			
			if (objCtr.defineProperty)
			{
				var	classListPropDesc = {	get: classListGetter,
											enumerable: true,
											configurable: true
										};
				try
				{
					objCtr.defineProperty( elemCtrProto, classListProp, classListPropDesc );
				}
				catch ( ex )
				{ // IE 8 doesn't support enumerable:true
					if ( ex.number === -0x7FF5EC54 )
					{
						classListPropDesc.enumerable = false;
						objCtr.defineProperty( elemCtrProto, classListProp, classListPropDesc );
					}
				}
			}
			else if ( objCtr[protoProp].__defineGetter__ )
			{
				elemCtrProto.__defineGetter__( classListProp, classListGetter );
			}
			
		}( self ));
		
	}
	
	var inlineImages = document.querySelectorAll( "img[data-inline-svg]" );
	
	for ( var i = 0, iLen = inlineImages.length; i < iLen; i++ )
	{
		var	img = inlineImages[i],
			imgID = img.getAttribute( 'id' ),
			imgClass = img.getAttribute( 'class' ),
			imgStyle = img.getAttribute( 'style' ),
			imgParent = img.parentNode,
			svgURL = img.getAttribute( 'src' ),
			request = new XMLHttpRequest();
		
		request.onreadystatechange = function ()
		{
			if( request.readyState === 4 )
			{
				if ( ( request.status >= 200 ) && ( request.status < 300 ) )
				{
					var svg = document.importNode( request.responseXML.documentElement, true );
					
					// Sanity check: is what we got an SVG element?
					if ( !( svg instanceof SVGElement ) )
					{
						throw 'NotAnSVG';
					}
					
					// Add replaced image's ID to the new SVG
					if ( imgID )
					{
						svg.setAttribute( 'id', imgID );
					}
					
					// Add replaced image's classes to the new SVG
					if ( imgClass )
					{
						svg.setAttribute( 'class', imgClass + ' inlined-svg' );
					}
					
					// Copy across the original's style (for positioning in particular).
					if ( imgStyle )
					{
						svg.setAttribute( 'style', img.getAttribute( 'style' ) );
					}
					
					svg.setAttribute( 'preserveAspectRatio', 'xMinYMin meet' );
					svg.setAttribute( 'viewBox', '0 0 ' + svg.getAttribute( 'width' ) + ' ' + svg.getAttribute( 'height' ) );
					
					// Set width and height the same as the replaced img.
					svg.setAttribute( 'width', img.width );
					svg.setAttribute( 'height', img.height );
					
					console.log( "svg " + svg.getAttribute( "id" ) + " (img " + (!img.complete?"in":"") + "complete):" );
					console.log( "    corresponding IMG " + img.getAttribute( "alt" ) + " is " + img.width + " × " + img.height );
					console.log( "    " + svg.getAttribute( "width" ) + " × " + svg.getAttribute( "height" ) );
					
					imgParent.replaceChild( svg, img );
				}
				else
				{
					throw request.status;
				}
			}
		};
		
		request.open('GET', svgURL, false);
		try
		{
			request.send();
		}
		catch ( e )
		{
			if ( e === 'NotAnSVG' )
			{
				alert( "You have attempted to inline something that doesn't appear to be an SVG image." );
			}
			else
			{
				alert('Failed to get the SVG file ' + svgURL + ' (HTTP ' + e + '). Make sure that the presentation and the file are served by a HTTP server and the file can be found there.');
			}
		}
	}
}

/*
	We need to ensure that the original image dimensions have been finalised.
	If the position-images plugin has been used, we need to wait for it to finish,
	otherwise wait for the document to be ready.
*/
if ( typeof positionImages !== 'undefined' )
{
	head.ready( 'plugins/position-images/position-images.js', inlineSVGs() );
}
else
{
	head.ready( document, inlineSVGs() );
}
