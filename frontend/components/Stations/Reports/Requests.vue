<template>
    <section
        class="card"
        role="region"
    >
        <div class="card-header text-bg-primary">
            <h2 class="card-title">
                {{ $gettext('Song Requests') }}
            </h2>
        </div>

        <div class="card-body">
            <nav
                class="nav nav-tabs"
                role="tablist"
            >
                <div
                    v-for="tab in tabs"
                    :key="tab.type"
                    class="nav-item"
                    role="presentation"
                >
                    <button
                        class="nav-link"
                        :class="(activeType === tab.type) ? 'active' : ''"
                        type="button"
                        role="tab"
                        @click="setType(tab.type)"
                    >
                        {{ tab.title }}
                    </button>
                </div>
            </nav>
        </div>

        <div
            v-if="activeType === 'pending'"
            class="card-body"
        >
            <button
                type="button"
                class="btn btn-danger"
                @click="doClear()"
            >
                <icon :icon="IconRemove" />
                <span>
                    {{ $gettext('Clear Pending Requests') }}
                </span>
            </button>
        </div>

        <data-table
            id="station_requests"
            :fields="fields"
            :provider="listItemProvider"
        >
            <template #cell(timestamp)="row">
                {{ formatIsoAsDateTime(row.item.timestamp) }}
            </template>
            <template #cell(played_at)="row">
                <span v-if="row.item.played_at === null">
                    {{ $gettext('Not Played') }}
                </span>
                <span v-else>
                    {{ formatIsoAsDateTime(row.item.played_at) }}
                </span>
            </template>
            <template #cell(song_title)="row">
                <div v-if="row.item.track.title">
                    <b>{{ row.item.track.title }}</b><br>
                    {{ row.item.track.artist }}
                </div>
                <div v-else>
                    {{ row.item.track.text }}
                </div>
            </template>
            <template #cell(ip)="row">
                {{ row.item.ip }}
            </template>
            <template #cell(actions)="row">
                <button
                    v-if="row.item.played_at === 0"
                    type="button"
                    class="btn btn-sm btn-danger"
                    @click="doDelete(row.item.links.delete)"
                >
                    {{ $gettext('Delete') }}
                </button>
            </template>
        </data-table>
    </section>
</template>

<script setup lang="ts">
import DataTable, {DataTableField} from "~/components/Common/DataTable.vue";
import Icon from "~/components/Common/Icon.vue";
import {computed, ref} from "vue";
import {useTranslate} from "~/vendor/gettext";
import {useNotify} from "~/functions/useNotify";
import {useAxios} from "~/vendor/axios";
import {getStationApiUrl} from "~/router";
import {IconRemove} from "~/components/Common/icons";
import useStationDateTimeFormatter from "~/functions/useStationDateTimeFormatter.ts";
import {useDialog} from "~/functions/useDialog.ts";
import {useApiItemProvider} from "~/functions/dataTable/useApiItemProvider.ts";
import {QueryKeys, queryKeyWithStation} from "~/entities/Queries.ts";

type RequestType = "pending" | "history";

interface TypeTabs {
    type: RequestType,
    title: string
}

const listUrl = getStationApiUrl('/reports/requests');
const clearUrl = getStationApiUrl('/reports/requests/clear');

const activeType = ref<RequestType>('pending');

const listUrlForType = computed(() => {
    return listUrl.value + '?type=' + activeType.value;
});

const {$gettext} = useTranslate();

const fields: DataTableField[] = [
    {key: 'timestamp', label: $gettext('Date Requested'), sortable: false},
    {key: 'played_at', label: $gettext('Date Played'), sortable: false},
    {key: 'song_title', isRowHeader: true, label: $gettext('Song Title'), sortable: false},
    {key: 'ip', label: $gettext('Requester IP'), sortable: false},
    {key: 'actions', label: $gettext('Actions'), sortable: false}
];

const listItemProvider = useApiItemProvider(
    listUrlForType,
    queryKeyWithStation([
        QueryKeys.StationReports
    ], [
        'requests',
        activeType
    ])
);

const refresh = () => {
    void listItemProvider.refresh();
}

const tabs: TypeTabs[] = [
    {
        type: 'pending',
        title: $gettext('Pending Requests')
    },
    {
        type: 'history',
        title: $gettext('Request History')
    }
];

const setType = (type: RequestType) => {
    activeType.value = type;
};

const {formatIsoAsDateTime} = useStationDateTimeFormatter();

const {confirmDelete} = useDialog();
const {notifySuccess} = useNotify();
const {axios} = useAxios();

const doDelete = (url: string) => {
    void confirmDelete({
        title: $gettext('Delete Request?'),
    }).then((result) => {
        if (result.value) {
            void axios.delete(url).then((resp) => {
                notifySuccess(resp.data.message);
                refresh();
            });
        }
    });
};

const doClear = () => {
    void confirmDelete({
        title: $gettext('Clear All Pending Requests?'),
        confirmButtonText: $gettext('Clear'),
    }).then((result) => {
        if (result.value) {
            void axios.post(clearUrl.value).then((resp) => {
                notifySuccess(resp.data.message);
                refresh();
            });
        }
    });
};
</script>
