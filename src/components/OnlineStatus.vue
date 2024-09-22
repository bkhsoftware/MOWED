<template>
  <div class="online-status" :class="{ 'is-offline': !isOnline }">
    {{ statusMessage }}
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'OnlineStatus',
  computed: {
    ...mapState(['isOnline']),
    statusMessage() {
      return this.isOnline ? 'Online' : 'Offline';
    }
  }
}
</script>

<style scoped>
.online-status {
  padding: 5px 10px;
  background-color: #4caf50;
  color: white;
  border-radius: 4px;
}

.online-status.is-offline {
  background-color: #f44336;
}
</style>
