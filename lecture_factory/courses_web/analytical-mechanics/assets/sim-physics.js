/* The UI and numerical checks share these physical models. SI units, radians. */
(function (root) {
  const g = 9.81;
  const models = {
    g,
    rk4(q, v, dt, acceleration) {
      const a1 = acceleration(q, v), q2 = q + v * dt / 2, v2 = v + a1 * dt / 2;
      const a2 = acceleration(q2, v2), q3 = q + v2 * dt / 2, v3 = v + a2 * dt / 2;
      const a3 = acceleration(q3, v3), q4 = q + v3 * dt, v4 = v + a3 * dt;
      const a4 = acceleration(q4, v4);
      return [q + dt * (v + 2 * v2 + 2 * v3 + v4) / 6,
              v + dt * (a1 + 2 * a2 + 2 * a3 + a4) / 6];
    },
    pendulum(l, m, theta, velocity) {
      return { acceleration: -g / l * Math.sin(theta),
        T: .5 * m * l * l * velocity * velocity, V: m * g * l * (1 - Math.cos(theta)) };
    },
    virtual(l, theta, deltaTheta, u, dt) {
      const dx=l*Math.cos(theta)*deltaTheta, dy=l*Math.sin(theta)*deltaTheta;
      return {deltaX:dx,deltaY:dy,actualX:dx+u*dt,actualY:dy,translation:u*dt};
    },
    rolling(m, force, k) {
      const acceleration = 2 * force / (m * (1 + k));
      const friction = m * acceleration - force;
      return { acceleration, friction, minMu: Math.abs(friction) / (m * g), smoothAcceleration: force / m };
    },
    atwood(m1, m2, M) {
      const acceleration = (m2 - m1) * g / (m1 + m2 + M / 2);
      return { acceleration, T1: m1 * (g + acceleration), T2: m2 * (g - acceleration) };
    },
    wedge(m, M, alpha) {
      const denominator = M + m * Math.sin(alpha) ** 2;
      return { sAcceleration: (M + m) * g * Math.sin(alpha) / denominator,
        xAcceleration: -m * g * Math.sin(alpha) * Math.cos(alpha) / denominator };
    },
    chain(l, muK, muS, x, velocity) {
      return { acceleration: g / l * ((1 + muK) * x - muK * l),
        canStart: x > muS * (l - x), threshold: muK * l / (1 + muK),
        kinetic: velocity > 0 };
    },
    ring(omega, R, theta, velocity) {
      return { acceleration: -omega * omega * Math.sin(theta), speed: R * Math.abs(velocity),
        invariant: .5 * R * R * velocity * velocity + omega * omega * R * R * (1 - Math.cos(theta)) };
    }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = models;
  root.MechanicsModels = models;
})(typeof window !== 'undefined' ? window : globalThis);
