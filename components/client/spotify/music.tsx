"use client";

export default function Music() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect
        fill="#FFFFFF"
        stroke="#FFFFFF"
        strokeWidth="15"
        width="30"
        height="30"
        x="25"
        y="170"
      >
        <animate
          attributeName="y"
          calcMode="spline"
          dur="2"
          values="170;100;170;"
          keySplines=".5 0 .5 1;.5 0 .5 1"
          repeatCount="indefinite"
          begin="-.4"
        ></animate>
        <animate
          attributeName="height"
          calcMode="spline"
          dur="2"
          values="30;100;30;"
          keySplines=".5 0 .5 1;.5 0 .5 1"
          repeatCount="indefinite"
          begin="-.4"
        ></animate>
      </rect>
      <rect
        fill="#FFFFFF"
        stroke="#FFFFFF"
        strokeWidth="15"
        width="30"
        height="30"
        x="85"
        y="170"
      >
        <animate
          attributeName="y"
          calcMode="spline"
          dur="2"
          values="170;100;170;"
          keySplines=".5 0 .5 1;.5 0 .5 1"
          repeatCount="indefinite"
          begin="-.2"
        ></animate>
        <animate
          attributeName="height"
          calcMode="spline"
          dur="2"
          values="30;100;30;"
          keySplines=".5 0 .5 1;.5 0 .5 1"
          repeatCount="indefinite"
          begin="-.2"
        ></animate>
      </rect>
      <rect
        fill="#FFFFFF"
        stroke="#FFFFFF"
        strokeWidth="15"
        width="30"
        height="30"
        x="145"
        y="170"
      >
        <animate
          attributeName="y"
          calcMode="spline"
          dur="2"
          values="170;100;170;"
          keySplines=".5 0 .5 1;.5 0 .5 1"
          repeatCount="indefinite"
          begin="0"
        ></animate>
        <animate
          attributeName="height"
          calcMode="spline"
          dur="2"
          values="30;100;30;"
          keySplines=".5 0 .5 1;.5 0 .5 1"
          repeatCount="indefinite"
          begin="0"
        ></animate>
      </rect>
    </svg>
  );
}
