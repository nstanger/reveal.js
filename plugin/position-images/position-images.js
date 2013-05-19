function positionImages()
{
	/*
		Process all aligned images (class "align"). Scale the image so that it's maximum dimension fits within the parent container, and where applicable align the image according to the specified additional alignment class. The trivial cases are done in CSS, but the more complex cases need to do calculations based on the images’ dimensions, which we don’t know in advance.
		
		If there’s no additional alignment class, then the element will just be positioned statically, which can lead to unpredictable results across browsers. Usually in such cases you’d be wanting to explicitly specify coordinates anyway.
		
		The effect of applying multiple alignment classes is … complicated, but there’s little point in doing so anyway, as the alignment classes are mutually incompatible.
	*/
	$("img.align").each(
		function()
		{
			/*
				Hack from StackOverflow (http://stackoverflow.com/questions/318630/get-real-image-width-and-height-with-javascript-in-safari-chrome) to ensure that the image dimensions are accurate. WebKit loads everything in parallel, so the JavaScript may be executed before the image is fully loaded (resulting in incorrect dimensions). Creating a new image object based on the original source appears to avoid this.
				
				This appears to be a problem even in $(window).load(), even though it is supposed to only be called once all objects on the page have been rendered (as expected, however, things definitely break if you use $(document).ready()).
			*/
			var img = new Image();
			img.src = $(this).attr( "src" );
			
			var originalHeight = img.height;
			var originalWidth = img.width;

			/*
				The dimensions of the containing DIV parent may be invalid if the section is currently not visible (i.e., display: none). We therefore need to briefly ensure that the section element is visible (i.e., display: block) then set it back to it's original state.
			*/
			var originalVisibility = $(this).parents( "section" ).css( "display" );
			$(this).parents( "section" ).css( "display", "block");
			
			var parentHeight = $(this).parents( "div.slide-content" ).height();
			var parentWidth = $(this).parents( "div.slide-content" ).width();
			var targetHeight = 0;
			var targetWidth = 0;

			$(this).parents( "section" ).css( "display", originalVisibility );
			
// 				console.log( "==================================================" );
// 				console.log( "Image = " + $(this).attr( "src" ) );
// 				console.log( "Image dimensions (original) = " + originalWidth + " × " + originalHeight );
// 				console.log( "Parent " + $(this).parents( "div.slide-content" ).prop( "tagName" ) + " dimensions = " + parentWidth + " × " + parentHeight );
			
			/*
				Figure out the orientation of the image so that we can maximise the appropriate dimension.
			*/
			if ( ( originalWidth / parentWidth ) > ( originalHeight / parentHeight ) )
			{
				/*
					Yet another cross-browser weirdness: in Firefox, max-height (or max-width) for the image is consistently returned as the computed height (in pixels) rather than the specified height (which is a percentage). In WebKit, the percentage value is returned, which seems more as you would expect.
					
					window.getComputedStyle() is supposed to always return the computed value in pixels, but experiment has shown that in WebKit it still returns the percentage (!).
					
					We therefore need to manually calculate the maximum dimensions for the image in pixels. The quick check for this is to look for a "%" in the returned value, and assume that it's in pixels otherwise (it seems very unlikely that it would be anything else!).
					
					Fortunately, parseInt() is intelligent enough to work in either case.
				*/
				if  ( $(this).css( "max-width" ).indexOf( "%" ) != -1 )
				{
					// Shift right by zero as a quick truncate.
					targetWidth = ( parseInt( $(this).css( "max-width" ) ) / 100 * parentWidth ) >> 0;
				}
				else // Assume it's pixels; it seems very unlikely to be anything else!
				{
					targetWidth = parseInt( $(this).css( "max-width" ) );
				}
				
				targetHeight = targetWidth / originalWidth * originalHeight;
			}
			else
			{
				if  ( $(this).css( "max-height" ).indexOf( "%" ) != -1 )
				{
					targetHeight = ( parseInt( $(this).css( "max-height" ) ) / 100 * parentHeight ) >> 0;
				}
				else // Assume it's pixels; it seems very unlikely to be anything else!
				{
					targetHeight = parseInt( $(this).css( "max-height" ) );
				}
				
				targetWidth = targetHeight / originalHeight * originalWidth;
			}
			
			$(this).css( "height", targetHeight );
			$(this).css( "width", targetWidth );
			
// 				console.log( "Image dimensions (target) = " + targetWidth + " × " + targetHeight );
// 				console.log( "Offset (target) = " + ( ( parentWidth - targetWidth ) >> 1 ) + " × " + ( ( parentHeight - targetHeight ) >> 1 ) );
			
			/*
				Apply any explicit positioning classes that can't be handled in CSS. No need for an "otherwise" case, as the element will just automatically position itself.
			*/
			if ( $(this).hasClass( "top" ) )
			{
				$(this).css( { top: "0px", left: ( ( parentWidth - targetWidth ) >> 1 ) + "px" } );
			}
			else if ( $(this).hasClass( "left" ) )
			{
				$(this).css( { top: ( ( parentHeight - targetHeight ) >> 1 ) + "px", left: "0px" } );
			}
			else if ( $(this).hasClass( "center" ) )
			{
				$(this).css( { top: ( ( parentHeight - targetHeight ) >> 1 ) + "px", left: ( ( parentWidth - targetWidth ) >> 1 ) + "px" } );
			}
			else if ( $(this).hasClass( "right" ) )
			{
				$(this).css( { top: ( ( parentHeight - targetHeight ) >> 1 ) + "px", right: "0px" } );
			}
			else if ( $(this).hasClass( "bottom" ) )
			{
				$(this).css( { bottom: "0px", left: ( ( parentWidth - targetWidth ) >> 1 ) + "px" } );
			}
		}
	);
}
