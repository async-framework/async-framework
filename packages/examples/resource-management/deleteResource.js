import { showAlert } from './show-alert.js';

export default function deleteResource({ element, signals }) {
    if (!confirm('Are you sure you want to delete this resource?')) return;

    const code = element.dataset.code;
    const resourcesSignal = signals.get("resources");
    const resources = resourcesSignal.get();
    
    const updatedResources = resources.filter(resource => resource.code !== code);
    resourcesSignal.set(updatedResources);
    showAlert('Resource deleted successfully');
}
