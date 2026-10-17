<script setup></script>

<template>
    <div class="sias-app">
        <router-view />
    </div>
</template>

<style>
.sias-app {
    background: var(--sias-bg);
    color: var(--sias-text-primary);
    min-height: 100vh;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
</style>
