const cheerio = require('cheerio');

const PHOTO_SIZES = [75, 100, 250, 400, 500, 540, 640, 1280];
const SQUARE_SIZES = { 75: true };

const isSquare = size => SQUARE_SIZES[size];

const getImageAtWidth = (url, size) => {
  const sizeStr = isSquare(size) ? `${size}sq` : size;
  return url.replace(/_\d+\./, `_${sizeStr}.`);
};

const getNewDimensions = (width, height, newWidth) => {
  const newHeight = isSquare(newWidth)
    ? newWidth
    : Math.floor((newWidth / width) * height);
  return {
    width: newWidth,
    height: newHeight
  };
};

const getClosestTumblrWidth = width =>
  PHOTO_SIZES.find(size => size > width) || last(PHOTO_SIZES);

const getRelevantAltWidths = width =>
  PHOTO_SIZES.slice(0, PHOTO_SIZES.indexOf(width)).reverse();

const createSizesFromOriginal = original => {
  const { url, width, height } = original;
  const closestWidth = getClosestTumblrWidth(width);
  const relevantAltWidths = getRelevantAltWidths(closestWidth);

  // There's a bug in the API where the image URL for the original
  // image doesn't actually match the dimensions, so let's rewrite it
  const originalSize = {
    width,
    height,
    url: getImageAtWidth(url, closestWidth)
  };

  const altSizes = [
    originalSize,
    ...relevantAltWidths.map(size => ({
      url: getImageAtWidth(url, size),
      ...getNewDimensions(width, height, size)
    }))
  ];

  return {
    original_size: originalSize,
    alt_sizes: altSizes
  };
};

const getImagesFromBody = body => {
  if (!body) {
    return [];
  }
  const $ = cheerio.load(body);
  return $('img[data-orig-width][data-orig-height]')
    .map((_, el) => ({
      url: $(el).attr('src'),
      width: $(el).data('orig-width'),
      height: $(el).data('orig-height')
    }))
    .get()
    .map(createSizesFromOriginal);
};

module.exports = {
  getImagesFromBody
};
