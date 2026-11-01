// Temporary world used until a world's own module is written: a small
// 3D stage where the gang dances, so every map card already opens.

export function placeholderWorld(ctx, title) {
  const { THREE, root, camera, hud } = ctx;
  const cast = [];
  let time = 0;
  return {
    start() {
      ctx.setupSky({});
      ctx.addLights(root);
      const floor = new THREE.Mesh(new THREE.CircleGeometry(8, 40), new THREE.MeshStandardMaterial({ color: '#f6d58e' }));
      floor.rotation.x = -Math.PI / 2;
      root.add(floor);
      ctx.castIds.forEach((id, i) => {
        const c = ctx.character(id);
        const a = (i / ctx.castIds.length) * Math.PI * 2;
        c.position.set(Math.cos(a) * 4, 0, Math.sin(a) * 4);
        c.lookAt(0, 0, 0);
        root.add(c);
        cast.push(c);
      });
      hud.banner(title, 2500);
      hud.setObjective('🚧 ' + (ctx.locale() === 'fr' ? 'Ce monde est en construction' : 'This world is being built'));
    },
    update(dt) {
      time += dt;
      camera.position.set(Math.cos(time * 0.3) * 11, 5, Math.sin(time * 0.3) * 11);
      camera.lookAt(0, 1.5, 0);
      cast.forEach((c) => c.userData.animate(dt, 'dance'));
    },
    dispose() {},
  };
}
