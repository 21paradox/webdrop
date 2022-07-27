<template>
  <div class="home">
    <Page1 msg="Welcome to Your Vue.js App"/>
  </div>
</template>

<script>
// @ is an alias to /src
import Page1 from '@/components/Page1.vue'

export default {
  name: 'HomeView',
  components: {
    Page1
  }
}
</script>
