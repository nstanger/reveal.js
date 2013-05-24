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
 * If the image is larger than its container, it will be automatically scaled
 * to fit along the longest dimension (taking max-width and max-height into
 * account). If the image is smaller than its container, you can force it to
 * scale to fit the container by adding the class "fit-to-container" to the
 * image.
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
	function computeCSSValue( srcValue, multiplier )
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
	
	
	positionImage = function( img, containerDIV, parentSections )
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
			need to briefly ensure that all parent section elements (there will
			be > 1 for nested slides) are visible (i.e., display: block) then
			set back to their original state.
		*/
		var originalVisibilities = new Array();
		for ( var s = 0; s < parentSections.length; s++ )
		{
			originalVisibilities[s] = parentSections[s].style.display;
			parentSections[s].style.display = 'block';
		}
		
		var	containerHeight = containerDIV.clientHeight,
			containerWidth = containerDIV.clientWidth;
		
		for ( var s = 0; s < parentSections.length; s++ )
		{
			parentSections[s].style.display = originalVisibilities[s];
		}
		
		/*
			We need to adjust for any margins that might be specified, otherwise
			the image size and positioning will off from what we would expect.
		*/
		var	imgMarginTop = computeCSSValue( window.getComputedStyle( img ).marginTop, containerHeight ),
			imgMarginBottom = computeCSSValue( window.getComputedStyle( img ).marginBottom, containerHeight ),
			imgMarginRight = computeCSSValue( window.getComputedStyle( img ).marginRight, containerWidth ),
			imgMarginLeft = computeCSSValue( window.getComputedStyle( img ).marginLeft, containerWidth );
		
		/*
			Hide the image before we start fiddling with it. This reduces the
			number of visible transitions that can occur, and may be faster?
		*/
		originalVisibility = img.style.visibility;
		img.style.visibility = "hidden";
		
		/*
			Fit the image to its container as appropriate. If the image is larger
			than the container, it's automatically scaled down. Otherwise it's
			left as is, unless "fit-to-container" is specified.
		*/
		if (img.classList.contains( 'fit-to-container' ) || ( targetHeight > containerHeight ) || ( targetWidth > containerWidth ) )
		{
			// Figure out the orientation of the image so that we can maximise the appropriate dimension.
			if ( ( originalWidth / containerWidth ) > ( originalHeight / containerHeight ) )
			{
				targetWidth = computeCSSValue( window.getComputedStyle( img ).maxWidth, containerWidth ) - imgMarginRight - imgMarginLeft;
				targetHeight = ( targetWidth / originalWidth * originalHeight ) >> 0;
			}
			else
			{
				targetHeight = computeCSSValue( window.getComputedStyle( img ).maxHeight, containerHeight ) - imgMarginBottom - imgMarginTop;
				targetWidth = ( targetHeight / originalHeight * originalWidth ) >> 0;
			}
			
			img.style.height = targetHeight + "px";
			img.style.width = targetWidth + "px";
		}
		
		/*
			Apply any alignment classes. In cases of conflict (e.g.,
			class="top bottom"), the last class specified wins.
		*/
		var alignClasses = img.classList
			imgTop = 0,
			imgLeft = 0;
			
		for ( var a = 0, aLen = alignClasses.length; a < aLen; a++ )
		{
			var thisClass = alignClasses[a];
			
			if ( thisClass === "top" ) imgTop = "0px";
			if ( thisClass === "middle" ) imgTop = ( ( containerHeight - targetHeight -imgMarginTop - imgMarginBottom ) >> 1 ) + "px";
			// We could just set bottom, but using the same dimension consistently ensures that later classes override earlier ones.
			if ( thisClass === "bottom" ) imgTop = ( containerHeight - targetHeight - imgMarginBottom ) + "px";
			if ( thisClass === "left" ) imgLeft = "0px";
			if ( ( thisClass === "center" ) || ( thisClass === "centre" ) ) imgLeft = ( ( containerWidth - targetWidth - imgMarginLeft - imgMarginRight ) >> 1 ) + "px";
			if ( thisClass === "right" ) imgLeft = ( containerWidth - targetWidth - imgMarginRight ) + "px";
		}
		
		img.style.top = imgTop;
		img.style.left = imgLeft;
		
		img.style.visibility = originalVisibility;
		
		img.isPositioned = true;
		
		img.dispatchEvent( new CustomEvent(
				"imagePositioned",
				{
					bubbles: true,
					cancelable: true
				} ) );
		
// 		console.log( "position img " + img.id + ": " + targetWidth + " × " + targetHeight + " @ " + imgLeft + ", " + imgTop );
// 		console.log( "    container size " + containerWidth + " × " + containerHeight );
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
			thisParent = containerDIV,
			alignedImages = containerDIV.querySelectorAll( 'img.align' ),
			parentSections = new Array();
		
		/*
			Find all the parent section element (see comment in positionImage).
			No nice, easy way to do this.
		*/
		while ( ( ( thisParent.tagName !== 'DIV') || !( thisParent.classList.contains( 'slides' ) ) ) && thisParent.parentNode )
		{
			if ( thisParent.tagName === 'SECTION' ) parentSections.push( thisParent );
			thisParent = thisParent.parentNode;
		}
		if ( parentSections.length === 0 )
		{
			throw "presentation contains a DIV image container outside any SECTION";
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
				positionImage( img, containerDIV, parentSections );
			}
			else
			{
				img.addEventListener( 'load', ( function() { positionImage( this, containerDIV, parentSections ); } ), false );
// 				console.log( ">>> added event handler to img " + img.id );
			}
			
		}
	}
})();
