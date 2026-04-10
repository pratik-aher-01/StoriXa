export function normalizeCameraUrl(value) {
  const trimmed = value.trim()
  if (!trimmed) return ''

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`

  try {
    const parsed = new URL(withProtocol)
    if (parsed.pathname === '/' || parsed.pathname === '') {
      parsed.pathname = '/video'
    }
    return parsed.toString()
  } catch {
    return withProtocol
  }
}

export function deriveSnapshotUrl(streamUrl) {
  if (!streamUrl) return ''

  try {
    const parsed = new URL(streamUrl)
    if (parsed.pathname.endsWith('/video')) {
      parsed.pathname = parsed.pathname.replace(/\/video$/i, '/photo.jpg')
    } else if (parsed.pathname.endsWith('/stream')) {
      parsed.pathname = parsed.pathname.replace(/\/stream$/i, '/capture')
    }
    parsed.searchParams.set('t', Date.now().toString())
    return parsed.toString()
  } catch {
    return streamUrl
  }
}

export async function analyzeFruitImage(imageUrl) {
  const img = new Image()
  img.crossOrigin = 'anonymous'

  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = () => reject(new Error('Snapshot could not be loaded.'))
    img.src = imageUrl
  })

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) {
    throw new Error('Canvas is not available in this browser.')
  }

  const sampleWidth = 120
  const sampleHeight = Math.max(1, Math.round((img.naturalHeight / Math.max(img.naturalWidth, 1)) * sampleWidth))
  canvas.width = sampleWidth
  canvas.height = sampleHeight
  context.drawImage(img, 0, 0, sampleWidth, sampleHeight)

  const { data } = context.getImageData(0, 0, sampleWidth, sampleHeight)
  const citrusMask = new Uint8Array(sampleWidth * sampleHeight)
  const appleMask = new Uint8Array(sampleWidth * sampleHeight)
  let citrusPixels = 0
  let applePixels = 0
  let yellowScore = 0
  let orangeScore = 0
  let appleRedScore = 0
  let appleWarmScore = 0
  let minX = sampleWidth
  let minY = sampleHeight
  let maxX = -1
  let maxY = -1

  const rgbToHue = (red, green, blue) => {
    const r = red / 255
    const g = green / 255
    const b = blue / 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const delta = max - min

    if (delta === 0) return 0

    let hue = 0
    if (max === r) {
      hue = ((g - b) / delta) % 6
    } else if (max === g) {
      hue = (b - r) / delta + 2
    } else {
      hue = (r - g) / delta + 4
    }

    hue *= 60
    return hue < 0 ? hue + 360 : hue
  }

  for (let index = 0; index < data.length; index += 4) {
    const red = data[index]
    const green = data[index + 1]
    const blue = data[index + 2]
    const alpha = data[index + 3]
    const pixelIndex = index / 4

    if (alpha < 120) continue

    const max = Math.max(red, green, blue)
    const min = Math.min(red, green, blue)
    const delta = max - min
    if (delta < 22 || max < 65) continue

    const hue = rgbToHue(red, green, blue)
    const saturation = max === 0 ? 0 : delta / max
    const value = max / 255
    const x = pixelIndex % sampleWidth
    const y = Math.floor(pixelIndex / sampleWidth)
    const isCitrusPixel = hue >= 28 && hue <= 72 && saturation >= 0.22 && value >= 0.3
    const isApplePixel =
      ((hue <= 20 || hue >= 340) && saturation >= 0.28 && value >= 0.24 && red > green + 18 && red > blue + 18) ||
      (hue >= 20 && hue <= 38 && saturation >= 0.3 && red > 120 && green < 155 && blue < 120)

    if (!isCitrusPixel && !isApplePixel) continue

    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)

    if (isCitrusPixel) {
      citrusPixels += 1
      citrusMask[pixelIndex] = 1

      if (hue >= 48) {
        yellowScore += 1 + (green - blue) / 255
      } else {
        orangeScore += 1 + (red - green + 24) / 255
      }
    }

    if (isApplePixel) {
      applePixels += 1
      appleMask[pixelIndex] = 1
      appleRedScore += 1 + (red - Math.max(green, blue)) / 255
      appleWarmScore += 1 + (red - blue) / 255
    }
  }

  const candidatePixels = citrusPixels + applePixels

  if (candidatePixels < 220 || maxX === -1) {
    return {
      fruit: 'Not sure',
      note: 'Keep one fruit centered in the frame with a plain background for detection.',
    }
  }

  let perimeter = 0
  for (let y = 0; y < sampleHeight; y += 1) {
    for (let x = 0; x < sampleWidth; x += 1) {
      const current = citrusMask[y * sampleWidth + x] || appleMask[y * sampleWidth + x]
      if (!current) continue

      const neighbors = [
        x === 0 ? 0 : (citrusMask[y * sampleWidth + (x - 1)] || appleMask[y * sampleWidth + (x - 1)]),
        x === sampleWidth - 1 ? 0 : (citrusMask[y * sampleWidth + (x + 1)] || appleMask[y * sampleWidth + (x + 1)]),
        y === 0 ? 0 : (citrusMask[(y - 1) * sampleWidth + x] || appleMask[(y - 1) * sampleWidth + x]),
        y === sampleHeight - 1 ? 0 : (citrusMask[(y + 1) * sampleWidth + x] || appleMask[(y + 1) * sampleWidth + x]),
      ]

      perimeter += neighbors.filter((value) => value === 0).length
    }
  }

  const width = maxX - minX + 1
  const height = maxY - minY + 1
  const aspectRatio = width / Math.max(height, 1)
  const fillRatio = candidatePixels / Math.max(width * height, 1)
  const elongation = Math.abs(aspectRatio - 1)
  const compactness = perimeter > 0 ? (4 * Math.PI * candidatePixels) / (perimeter * perimeter) : 0
  const roundness = 1 - Math.min(elongation, 1)

  const citrusCoverage = citrusPixels / Math.max(candidatePixels, 1)
  const appleCoverage = applePixels / Math.max(candidatePixels, 1)

  let appleConfidence = 0.18
  appleConfidence += Math.min(0.42, appleCoverage * 0.55)
  appleConfidence += Math.min(0.22, (appleRedScore / Math.max(applePixels, 1)) * 0.11)
  appleConfidence += Math.min(0.12, (appleWarmScore / Math.max(applePixels, 1)) * 0.05)
  appleConfidence += Math.min(0.14, Math.max(0, roundness - 0.55) * 0.4)
  appleConfidence += Math.min(0.08, Math.max(0, compactness - 0.58) * 0.35)

  if (appleCoverage > 0.28 && appleConfidence >= 0.5 && appleConfidence > citrusCoverage + 0.08) {
    return {
      fruit: 'Red Apple',
      note: `Detected as red apple with ${Math.round(Math.min(appleConfidence, 0.96) * 100)}% confidence using dominant red tones and rounded shape.`,
    }
  }

  if (citrusPixels < 160) {
    return {
      fruit: 'Not sure',
      note: 'The frame contains too little citrus detail to separate lemon, orange, and apple confidently.',
    }
  }

  const normalizedYellow = yellowScore / citrusPixels
  const normalizedOrange = orangeScore / citrusPixels

  let lemonConfidence = 0.5
  let orangeConfidence = 0.5

  lemonConfidence += Math.min(0.32, Math.max(0, normalizedYellow - normalizedOrange) * 0.42)
  lemonConfidence += Math.min(0.18, elongation * 0.22)
  lemonConfidence += Math.min(0.08, Math.max(0, 0.62 - compactness))
  lemonConfidence += Math.min(0.06, Math.max(0, 0.72 - fillRatio))

  orangeConfidence += Math.min(0.32, Math.max(0, normalizedOrange - normalizedYellow) * 0.42)
  orangeConfidence += Math.min(0.18, Math.max(0, compactness - 0.58))
  orangeConfidence += Math.min(0.08, Math.max(0, 0.88 - elongation))
  orangeConfidence += Math.min(0.06, Math.max(0, fillRatio - 0.58))

  const totalConfidence = lemonConfidence + orangeConfidence
  lemonConfidence /= totalConfidence
  orangeConfidence /= totalConfidence

  if (Math.abs(lemonConfidence - orangeConfidence) < 0.08) {
    return {
      fruit: 'Not sure',
      note: 'This looks close to both lemon and orange. Improve lighting or isolate the fruit to get a cleaner result.',
    }
  }

  if (lemonConfidence > orangeConfidence) {
    return {
      fruit: 'Lemon',
      note: `Detected as lemon with ${Math.round(lemonConfidence * 100)}% confidence using yellow tone and slightly elongated shape.`,
    }
  }

  return {
    fruit: 'Orange',
    note: `Detected as orange with ${Math.round(orangeConfidence * 100)}% confidence using orange tone and rounder shape.`,
  }
}
