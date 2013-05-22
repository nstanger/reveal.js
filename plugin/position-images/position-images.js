/**
 * Positioning images within a container can be fiddly, especially when you're
 * dealing with vector images of unspecified size. This plugin helps in two ways.
 * 
 * First it provides simple positioning keywords for the six basic positions
 * (top, left, bottom, right, center, middle), which can be combined in the
 * obvious ways.
 * 
 * Second, it can automatically scale the image so that its largest dimension
 * is maximised within its parent container.
 * 
 * Note this only applies to the IMG element, not any other method of embedding
 * images in HTML. It works very well with the inline-svg plugin, but should
 * be loaded first.
 *
 * To use this, you need to place the image inside a container DIV with the class
 * "img-container". The IMG itself should have the class "align", followed by
 * one or more of the six positioning classes ("top", "left", "bottom", "right",
 * "center"/"centre", "middle"). If no positioning classes are specified, the
 * image will just be positioned statically, which can lead to unpredictable
 * results across browsers. Usually in such cases you’d be wanting to explicitly
 * specify coordinates anyway. If you specify conflicting classes (e.g., both
 * "top" and "bottom"), the last one specified wins.
 * 
 * You may also include the class "maximize" (or "maximise", we're dialect
 * agnostic ;) to make the image scale to fit its container as best as possible.
 *
 */

// Make this global so other plugins can use it as a flag to detect whether this has been loaded.
var positionImage;

(function()
{
	/*
		A cross-browser weirdness: in Firefox, max-height (or max-width) for the
		image is consistently returned as the computed height (in pixels) rather
		than the specified height (which is a percentage). In WebKit, the percentage
		value is returned, which seems more as you would expect.
		
		Conversely, window.getComputedStyle() is supposed to always return the
		computed value in pixels, but experiment has shown that in WebKit it
		returns the percentage (!).
		
		We therefore need to manually calculate the maximum dimensions for the
		image in pixels. The quick check for this is to look for a "%" in the
		returned value, and assume that it's in pixels otherwise (it seems very
		unlikely that it would be anything else!).
		
		Fortunately, parseInt() is intelligent enough to work in either case.
	*/
	function parseCSSValue( srcValue, multiplier )
	{
		if  ( srcValue.indexOf( "%" ) !== -1 )
		{
			// Shift right by zero as a quick truncate.
			return ( ( parseInt( srcValue ) / 100 * multiplier ) >> 0 );
		}
		else // Assume it's pixels.
		{
			return ( parseInt( srcValue ) >> 0 );
		}
	}
	
	
	positionImage = function( img, containerDIV, parentSection )
	{
		// The container needs to be at least position: relative, and the image position: absolute.
		containerDIV.style.position = 'relative';
		img.style.position = 'absolute';
	
		var	originalHeight = img.height,
			originalWidth = img.width,
			targetHeight = originalHeight,
			targetWidth = originalWidth;
	
		/*
			The dimensions of the containing DIV parent may be invalid if the
			section is currently not visible (i.e., display: none). We therefore
			need to briefly ensure that the section element is visible (i.e.,
			display: block) then set it back to it's original state.
		*/
		var originalVisibility = parentSection.style.display;
		parentSection.style.display = "block";
		
		var	parentHeight = containerDIV.clientHeight,
			parentWidth = containerDIV.clientWidth;
		
		parentSection.style.display = originalVisibility;
		
		/*
			We need to adjust for any margins that might be specified, otherwise
			the image size and positioning will off from what we would expect.
		*/
		var	imgMarginTop = parseCSSValue( window.getComputedStyle( img ).marginTop, parentHeight ),
			imgMarginBottom = parseCSSValue( window.getComputedStyle( img ).marginBottom, parentHeight ),
			imgMarginRight = parseCSSValue( window.getComputedStyle( img ).marginRight, parentWidth ),
			imgMarginLeft = parseCSSValue( window.getComputedStyle( img ).marginLeft, parentWidth );
		
		/*
			Hide the image before we start fiddling with it. This reduces the
			number of visible transitions that can occur, and may be faster?
		*/
		originalVisibility = img.style.display;
		img.style.display = "none";
		
		// Maximise the dimensions of the image if appropriate.
		if ( img.classList.contains( 'maximize' ) || img.classList.contains( 'maximise' ) ) // dialect agnostic :)
		{
			// Figure out the orientation of the image so that we can maximise the appropriate dimension.
			if ( ( originalWidth / parentWidth ) > ( originalHeight / parentHeight ) )
			{
				targetWidth = parseCSSValue( window.getComputedStyle( img ).maxWidth, parentWidth ) - imgMarginRight - imgMarginLeft;
				targetHeight = ( targetWidth / originalWidth * originalHeight ) >> 0;
			}
			else
			{
				targetHeight = parseCSSValue( window.getComputedStyle( img ).maxHeight, parentHeight ) - imgMarginBottom - imgMarginTop;
				targetWidth = ( targetHeight / originalHeight * originalWidth ) >> 0;
			}
			
			img.style.height = targetHeight + "px";
			img.style.width = targetWidth + "px";
		}
		
		/*
			Apply any alignment classes. In cases of conflict (e.g.,
			class="top bottom"), the last class specified wins.
		*/
		var alignClasses = img.classList;
		for ( var a = 0, aLen = alignClasses.length; a < aLen; a++ )
		{
			var thisClass = alignClasses[a];
			
			if ( thisClass === "top" ) img.style.top = "0px";
			if ( thisClass === "middle" ) img.style.top = ( ( parentHeight - targetHeight -imgMarginTop - imgMarginBottom ) >> 1 ) + "px";
			// We could just set bottom, but using the same dimension consistently ensures that later classes override earlier ones.
			if ( thisClass === "bottom" ) img.style.top = ( parentHeight - targetHeight - imgMarginBottom ) + "px";
			if ( thisClass === "left" ) img.style.left = "0px";
			if ( ( thisClass === "center" ) || ( thisClass === "centre" ) ) img.style.left = ( ( parentWidth - targetWidth - imgMarginLeft - imgMarginRight ) >> 1 ) + "px";
			if ( thisClass === "right" ) img.style.left = ( parentWidth - targetWidth - imgMarginRight ) + "px";
		}
		
		img.style.display = originalVisibility;
		
		img.isPositioned = true;
		
		img.dispatchEvent( new CustomEvent(
				"imagePositioned",
				{
					bubbles: true,
					cancelable: true
				} ) );
		
// 		console.log( "position img " + img.id + ": " + img.width + " × " + img.height );
	}
	
	
	/*
		We need to make sure that we only run the positioning code once the images
		are actually loaded, otherwise the dimensions, etc., will all be wrong. The
		solution is to iterate through each image, and if it isn't loaded yet, add
		an onload event listener. We don't need to worry about caching vs. onload,
		because all we care about is that the image is loaded.
	*/
	var	imgContainers = document.querySelectorAll( 'div.img-container' );
	
	for ( var c = 0, cLen = imgContainers.length; c < cLen; c++ )
	{
		var containerDIV = imgContainers[c],
			parentSection = containerDIV,
			alignedImages = containerDIV.querySelectorAll( 'img.align' );
		
		// Find the parent section element. No nice, easy way to do this.
		while ( parentSection && parentSection.tagName !== 'SECTION' ) parentSection = parentSection.parentNode;
		if ( !parentSection )
		{
			throw "presentation contains a DIV with no parent SECTION";
		}
		
		for ( var i = 0, iLen = alignedImages.length; i < iLen; i++ )
		{
			var	img = alignedImages[i];

			img.isPositioned = false; // to hold up anyone who has to come after
			
			/*
				If the image has finished loading, go ahead and position it, otherwise
				install a listener to run when it eventually does load.
			*/
			if ( img.complete )
			{
				positionImage( img, containerDIV, parentSection );
			}
			else
			{
				img.addEventListener( 'load', ( function() { positionImage( this, containerDIV, parentSection ); } ), false );
// 				console.log( ">>> added event handler to img " + img.id );
			}
			
		}
	}
})();
