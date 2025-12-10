<template>
  <section class="roster">
    <div class="header">SQUAD ROSTER</div>
    <ul>
      <li v-for="(m, i) in members" :key="i">
        <div class="left">
          <div class="avatar">{{ m.initials }}</div>
          <div class="meta">
            <div class="name">{{ m.name }}</div>
            <div class="role">{{ m.role }}</div>
          </div>
        </div>
        <div class="status" :class="m.status">{{ m.statusLabel }}</div>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{ members?: Array<any> }>();
const members = props.members ?? [
  { name:'Alex', initials:'AX', role:'Infiltrator', status:'ok', statusLabel:'OK' },
  { name:'Marta', initials:'MT', role:'Scout', status:'injured', statusLabel:'INJ' }
];
</script>

<style scoped>
.roster{ background: var(--bg-panel); border:1px solid var(--border-color); border-radius:8px; padding:12px; box-shadow: 0 8px 20px rgba(0,0,0,0.18); }
.header{ color:var(--text-accent); font-weight:700; margin-bottom:8px; font-family:monospace }
ul{ list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:8px }
li{ display:flex; justify-content:space-between; align-items:center }
.left{ display:flex; gap:10px; align-items:center }
.avatar{ width:36px; height:36px; border-radius:6px; background:rgba(255,189,0,0.12); display:flex; align-items:center; justify-content:center; font-weight:700; color:var(--text-accent) }
.meta .name{ font-weight:700 }
.meta .role{ font-size:0.8rem; color:var(--text-secondary) }
.status.ok{ color:#7dff7d; font-weight:800 }
.status.injured{ color:#ffb36b; font-weight:800 }
</style>
