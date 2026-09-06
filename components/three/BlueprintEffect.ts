import { Effect, EffectAttribute, BlendFunction } from "postprocessing";
import { Uniform, Vector3 } from "three";

// The scene renders as a blueprint: every depth discontinuity becomes a chalk
// line, mid-tones are shaded with a screen-locked 4x4 ordered dither (a print
// artefact, not a texture that swims with the geometry), and the print is very
// slightly misregistered. One merged pass; depth comes from the composer.
const fragment = /* glsl */ `
uniform float uEdge;
uniform float uDither;
uniform float uMisreg;
uniform vec3 uChalk;

float bayer4(vec2 p) {
  vec2 q = floor(mod(p, 4.0));
  float x = q.x, y = q.y;
  // closed-form 4x4 Bayer: interleave bits of x^y and y
  float a = mod(x + y, 2.0);
  float b = mod(floor(x * 0.5) + floor(y * 0.5), 2.0);
  float c = mod(y, 2.0);
  float d = mod(floor(y * 0.5), 2.0);
  return (a * 8.0 + c * 4.0 + b * 2.0 + d) / 16.0 + 1.0 / 32.0;
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 t = texelSize;
  float d0 = readDepth(uv);
  float dl = readDepth(uv - vec2(t.x, 0.0));
  float dr = readDepth(uv + vec2(t.x, 0.0));
  float du = readDepth(uv - vec2(0.0, t.y));
  float dd = readDepth(uv + vec2(0.0, t.y));
  // second derivative of depth: silhouettes and creases, not smooth slopes
  float lap = abs(dl + dr - 2.0 * d0) + abs(du + dd - 2.0 * d0);
  // depth buffer is non-linear; scale by (1 - depth) so far geometry is not all edge
  float edge = smoothstep(0.0004, 0.0035, lap * (1.0 - d0) * uEdge);
  edge *= step(d0, 0.9995); // never on the clear colour

  // misregistration: the red plate is printed a hair to the right
  vec3 col = inputColor.rgb;
  col.r = texture2D(inputBuffer, uv + vec2(t.x * uMisreg, 0.0)).r;

  // dithered shading: quantise mid-tones toward chalk, leave highlights (bloom) alone
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  float mid = smoothstep(0.04, 0.22, lum) * (1.0 - smoothstep(0.45, 0.8, lum));
  float dot4 = step(bayer4(gl_FragCoord.xy), lum * 1.6);
  col = mix(col, mix(col * 0.55, uChalk * 0.5 + col * 0.5, dot4), mid * uDither);

  col = mix(col, uChalk, edge * 0.85);
  outputColor = vec4(col, inputColor.a);
}`;

export class BlueprintEffect extends Effect {
  constructor({ edge = 1, dither = 0.55, misreg = 1 } = {}) {
    super("BlueprintEffect", fragment, {
      blendFunction: BlendFunction.NORMAL,
      attributes: EffectAttribute.DEPTH,
      uniforms: new Map<string, Uniform>([
        ["uEdge", new Uniform(edge)],
        ["uDither", new Uniform(dither)],
        ["uMisreg", new Uniform(misreg)],
        ["uChalk", new Uniform(new Vector3(0.933, 0.953, 1.0))],
      ]),
    });
  }
}
